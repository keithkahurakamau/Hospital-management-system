import os
import requests
import base64
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# --- DARAJA SANDBOX CREDENTIALS ---
# (Replace these with your actual keys from the Safaricom Developer Portal)
MPESA_CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY", "your_sandbox_consumer_key")
MPESA_CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET", "your_sandbox_consumer_secret")
MPESA_SHORTCODE = os.getenv("MPESA_SHORTCODE", "174379") # Standard Sandbox Paybill
MPESA_PASSKEY = os.getenv("MPESA_PASSKEY", "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919") # Sandbox Passkey
MPESA_ENV = os.getenv("MPESA_ENV", "sandbox") # Change to 'production' later

def get_mpesa_access_token():
    """Authenticates with Safaricom and returns a temporary access token."""
    base_url = "https://sandbox.safaricom.co.ke" if MPESA_ENV == "sandbox" else "https://api.safaricom.co.ke"
    api_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
    
    auth_string = f"{MPESA_CONSUMER_KEY}:{MPESA_CONSUMER_SECRET}".encode("utf-8")
    auth_base64 = base64.b64encode(auth_string).decode("utf-8")
    
    headers = {"Authorization": f"Basic {auth_base64}"}
    response = requests.get(api_url, headers=headers)
    response.raise_for_status() # Will throw an error if authentication fails
    
    return response.json()["access_token"]

def initiate_stk_push(phone_number: str, amount: float, reference: str):
    """Triggers the M-Pesa PIN prompt on the patient's phone."""
    access_token = get_mpesa_access_token()
    base_url = "https://sandbox.safaricom.co.ke" if MPESA_ENV == "sandbox" else "https://api.safaricom.co.ke"
    api_url = f"{base_url}/mpesa/stkpush/v1/processrequest"
    
    # Generate Daraja Password
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password_str = f"{MPESA_SHORTCODE}{MPESA_PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode("utf-8")).decode("utf-8")
    
    # Format phone number to 254XXXXXXXXX
    phone = str(phone_number).replace("+", "").replace(" ", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
        
    # The URL Safaricom will hit to tell us if the payment succeeded
    # We use your Render URL here so Safaricom can reach it!
    backend_url = os.getenv("RENDER_EXTERNAL_URL", "https://medicare-backend-u7r1.onrender.com")
    callback_url = f"{backend_url}/api/billing/mpesa-callback"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "BusinessShortCode": MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount), # M-Pesa requires whole numbers
        "PartyA": phone,       # The patient's phone
        "PartyB": MPESA_SHORTCODE, # Your Paybill/Till
        "PhoneNumber": phone,
        "CallBackURL": callback_url,
        "AccountReference": reference[:12], # Max 12 characters
        "TransactionDesc": "Hospital Bill"
    }
    
    response = requests.post(api_url, json=payload, headers=headers)
    return response.json()