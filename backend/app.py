from flask import Flask, jsonify, request, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
from datetime import datetime, timedelta
from web3 import Web3
import io
import json

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

db = SQLAlchemy(app)

# Web3 initialization
try:
    w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
    if not w3.is_connected():
        raise ConnectionError("Failed to connect to Ethereum node")
    
    with open('RTI.json') as f:
        contract_abi = json.load(f)['abi']
    
    contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    rti_contract = w3.eth.contract(address=contract_address, abi=contract_abi)
        
except Exception as e:
    print(f"Web3 initialization error: {str(e)}")
    rti_contract = None

# Database model with blockchain_id
class RTIRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    citizen_address = db.Column(db.String(42), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    file_data = db.Column(db.LargeBinary)
    file_name = db.Column(db.String(100))
    file_type = db.Column(db.String(50))
    bounty = db.Column(db.Float, nullable=False)
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    response_text = db.Column(db.Text)
    officer_address = db.Column(db.String(42))
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    blockchain_id = db.Column(db.Integer)  # Added field

# Routes
@app.route('/rtis', methods=['GET', 'POST', 'OPTIONS'])
def handle_rtis():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    if request.method == 'POST':
        return create_rti()
    return get_rtis()

def create_rti():
    data = request.form
    file = request.files.get('file')
    
    try:
        deadline_days = int(data.get('deadline_days', 30))
        deadline = datetime.utcnow() + timedelta(days=deadline_days)
        bounty = float(data.get('bounty'))
        
        new_rti = RTIRequest(
            citizen_address=data.get('citizen_address'),
            title=data.get('title'),
            description=data.get('description'),
            bounty=bounty,
            deadline=deadline
        )
        
        if file:
            new_rti.file_data = file.read()
            new_rti.file_name = secure_filename(file.filename)
            new_rti.file_type = file.content_type
        
        db.session.add(new_rti)
        db.session.commit()
        
        if not rti_contract:
            raise ValueError("Blockchain connection not available")
            
        tx_hash = rti_contract.functions.createRTI(
            data.get('title'),
            data.get('description'),
            int(deadline.timestamp())
        ).transact({
            'from': data.get('citizen_address'),
            'value': Web3.to_wei(bounty, 'ether'),
            'gas': 1000000
        })
        
        # Get blockchain ID
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        blockchain_id = rti_contract.functions.getRTICount().call() - 1
        new_rti.blockchain_id = blockchain_id
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'RTI created successfully',
            'rti_id': new_rti.id,
            'blockchain_id': blockchain_id,
            'tx_hash': tx_hash.hex()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

def get_rtis():
    rtis = RTIRequest.query.all()
    result = []
    
    for rti in rtis:
        result.append({
            'id': rti.id,
            'blockchain_id': rti.blockchain_id,
            'title': rti.title,
            'description': rti.description,
            'bounty': rti.bounty,
            'deadline': rti.deadline.isoformat(),
            'status': rti.status,
            'has_file': rti.file_data is not None,
            'created_at': rti.created_at.isoformat()
        })
    
    return jsonify(result)

@app.route('/respond', methods=['POST', 'OPTIONS'])
def respond_to_rti():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    data = request.get_json()
    rti_id = data.get('rti_id')
    response_text = data.get('response_text')
    officer_address = data.get('officer_address')
    
    rti = RTIRequest.query.get(rti_id)
    if not rti:
        return jsonify({'success': False, 'error': 'RTI not found'}), 404
    
    rti.status = 'Responded'
    rti.response_text = response_text
    rti.officer_address = officer_address
    db.session.commit()
    
    try:
        if not rti_contract:
            raise ValueError("Blockchain connection not available")
            
        tx_hash = rti_contract.functions.submitResponse(
            rti.blockchain_id,
            response_text
        ).transact({
            'from': officer_address,
            'gas': 1000000
        })
        
        return jsonify({
            'success': True,
            'message': 'Response submitted',
            'tx_hash': tx_hash.hex()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/verify', methods=['POST', 'OPTIONS'])
def verify_rti():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    data = request.get_json()
    rti_id = data.get('rti_id')
    admin_address = data.get('admin_address')
    
    rti = RTIRequest.query.get(rti_id)
    if not rti:
        return jsonify({'success': False, 'error': 'RTI not found'}), 404
    
    if rti.status != 'Responded':
        return jsonify({'success': False, 'error': 'RTI not in Responded state'}), 400
    
    try:
        if not rti_contract:
            raise ValueError("Blockchain connection not available")
            
        tx_hash = rti_contract.functions.verifyAndRelease(
            rti.blockchain_id
        ).transact({
            'from': admin_address,
            'gas': 1000000
        })
        
        rti.status = 'Verified'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'RTI verified and bounty released',
            'tx_hash': tx_hash.hex()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/refund', methods=['POST', 'OPTIONS'])
def refund_rti():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    data = request.get_json()
    rti_id = data.get('rti_id')
    
    rti = RTIRequest.query.get(rti_id)
    if not rti:
        return jsonify({'success': False, 'error': 'RTI not found'}), 404
    
    if rti.status != 'Pending' and rti.status != 'Rejected':
        return jsonify({'success': False, 'error': 'Cannot refund this RTI'}), 400
    
    if datetime.utcnow() < rti.deadline:
        return jsonify({'success': False, 'error': 'Deadline not yet passed'}), 400
    
    try:
        if not rti_contract:
            raise ValueError("Blockchain connection not available")
            
        tx_hash = rti_contract.functions.refundBounty(
            rti.blockchain_id
        ).transact({
            'from': rti.citizen_address,
            'gas': 1000000
        })
        
        rti.status = 'Refunded'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Bounty refunded',
            'tx_hash': tx_hash.hex()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/download/<int:rti_id>', methods=['GET'])
def download_file(rti_id):
    rti = RTIRequest.query.get(rti_id)
    if not rti or not rti.file_data:
        return jsonify({'success': False, 'error': 'File not found'}), 404
    
    return send_file(
        io.BytesIO(rti.file_data),
        mimetype=rti.file_type,
        as_attachment=True,
        download_name=rti.file_name
    )

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)

""" # app.py
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = SQLAlchemy(app)

class RTIRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    requester_address = db.Column(db.String(42), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    ipfs_hash = db.Column(db.String(100), nullable=False)
    bounty = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deadline = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')
    responder_address = db.Column(db.String(42))
    response_ipfs_hash = db.Column(db.String(100))

@app.route('/rtis', methods=['GET'])
def get_rtis():
    rtis = RTIRequest.query.all()
    return jsonify([{
        'id': rti.id,
        'title': rti.title,
        'description': rti.description,
        'ipfs_hash': rti.ipfs_hash,
        'bounty': rti.bounty,
        'status': rti.status,
        'created_at': rti.created_at.isoformat(),
        'deadline': rti.deadline.isoformat() if rti.deadline else None,
        'requester_address': rti.requester_address,
        'responder_address': rti.responder_address,
        'response_ipfs_hash': rti.response_ipfs_hash
    } for rti in rtis])

@app.route('/rtis', methods=['POST'])
def create_rti():
    data = request.json
    deadline = datetime.fromisoformat(data['deadline'])
    rti = RTIRequest(
        requester_address=data['requester_address'],
        title=data['title'],
        description=data.get('description', ''),
        ipfs_hash=data['ipfs_hash'],
        bounty=data['bounty'],
        deadline=deadline
    )
    db.session.add(rti)
    db.session.commit()
    return jsonify({'id': rti.id}), 201

@app.route('/rtis/<int:rti_id>', methods=['PATCH'])
def update_rti(rti_id):
    data = request.json
    rti = RTIRequest.query.get_or_404(rti_id)

    if 'responder_address' in data:
        rti.responder_address = data['responder_address']
    if 'response_ipfs_hash' in data:
        rti.response_ipfs_hash = data['response_ipfs_hash']
    if 'status' in data:
        rti.status = data['status']

    db.session.commit()
    return jsonify({'message': 'RTI updated'})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    fake_ipfs_hash = filename  # Simulating IPFS hash with filename
    return jsonify({'ipfs_hash': fake_ipfs_hash})

@app.route('/ipfs/<string:ipfs_hash>', methods=['GET'])
def serve_file(ipfs_hash):
    return send_from_directory(app.config['UPLOAD_FOLDER'], ipfs_hash)

@app.route('/verify-doc', methods=['POST'])
def verify_doc():
    return jsonify({'verified': True, 'message': 'Document verified successfully'})

@app.route('/esign', methods=['POST'])
def esign():
    return jsonify({'signed': True, 'signature': 'mock_signature_123'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(port=5000, debug=True)"""
