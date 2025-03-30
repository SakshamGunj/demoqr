# main.py (updated WhatsApp-related sections)

from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
import logging
import requests
from fastapi.staticfiles import StaticFiles
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("static/spinthewheel.html", "r" ,encoding="utf-8") as f:
        return f.read()

@app.get("/form", response_class=HTMLResponse)
async def read_root():
    with open("static/feedback.html", "r",encoding="utf-8") as f:
        return f.read()

# Odoo Session Class (unchanged)
class OdooSession:
    def __init__(self, base_url, db, username, password):
        self.base_url = base_url
        self.db = db
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.uid = None
        self._authenticate()

    def _authenticate(self):
        login_url = f"{self.base_url}/web/session/authenticate"
        payload = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "db": self.db,
                "login": self.username,
                "password": self.password
            },
            "id": 1
        }
        response = self.session.post(login_url, json=payload)
        response.raise_for_status()
        result = response.json()
        if 'error' in result:
            raise Exception(f"Authentication failed: {result['error']}")
        self.uid = result['result']['uid']
        logger.info(f"Authenticated successfully with UID: {self.uid}")

    def call_kw(self, model, method, args=None, kwargs=None, endpoint="/web/dataset/call_kw"):
        if args is None:
            args = []
        if kwargs is None:
            kwargs = {}
        payload = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "model": model,
                "method": method,
                "args": args,
                "kwargs": kwargs
            },
            "id": self._get_next_id()
        }
        url = f"{self.base_url}{endpoint}/{model}/{method}"
        headers = self._get_headers()
        response = self.session.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

    def _get_headers(self):
        return {
            "accept": "*/*",
            "content-type": "application/json",
            "origin": self.base_url,
            "referer": f"{self.base_url}/odoo/contacts/3",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
        }

    def _get_next_id(self):
        if not hasattr(self, '_request_id'):
            self._request_id = 100
        self._request_id += 1
        return self._request_id

# Updated WhatsApp Functions with Detailed Logging
def create_whatsapp_composer(session, partner_id, template_id, phone, variables):
    composer_data = {
        "res_model": "res.partner",
        "batch_mode": False,
        "wa_template_id": template_id,
        "phone": phone,
        "header_text_1": False,
        "free_text_1": variables.get("1", ""),
        "free_text_2": variables.get("2", ""),
        "free_text_3": variables.get("3", ""),
        "free_text_4": False,
        "free_text_5": False,
        "free_text_6": False,
        "free_text_7": False,
        "free_text_8": False,
        "free_text_9": False,
        "free_text_10": False,
        "button_dynamic_url_1": False,
        "button_dynamic_url_2": False
    }
    context = {
        "lang": "en_IN",
        "tz": "Asia/Calcutta",
        "uid": session.uid,
        "allowed_company_ids": [1],
        "active_model": "res.partner",
        "active_id": partner_id,
        "default_phone": phone
    }
    specification = {
        "invalid_phone_number_count": {},
        "is_demo_account": {},
        "res_model": {},
        "number_of_free_text": {},
        "number_of_free_text_button": {},
        "is_header_free_text": {},
        "is_button_dynamic": {},
        "batch_mode": {},
        "wa_template_id": {"fields": {"display_name": {}}},
        "phone": {},
        "header_text_1": {},
        "free_text_1": {},
        "free_text_2": {},
        "free_text_3": {},
        "free_text_4": {},
        "free_text_5": {},
        "free_text_6": {},
        "free_text_7": {},
        "free_text_8": {},
        "free_text_9": {},
        "free_text_10": {},
        "button_dynamic_url_1": {},
        "button_dynamic_url_2": {},
        "preview_whatsapp": {}
    }
    response = session.call_kw(
        "whatsapp.composer",
        "web_save",
        args=[[], composer_data],
        kwargs={"context": context, "specification": specification}
    )
    logger.info(f"WhatsApp composer creation response: {json.dumps(response, indent=2)}")
    if 'result' in response and isinstance(response['result'], list) and response['result']:
        composer_id = response['result'][0]['id']
        logger.info(f"WhatsApp composer created with ID: {composer_id}")
        return composer_id
    else:
        logger.error(f"Failed to create WhatsApp composer. Response: {json.dumps(response, indent=2)}")
        return None

def send_whatsapp_message(session, composer_id, partner_id, phone):
    payload = {
        "jsonrpc": "2.0",
        "method": "call",
        "params": {
            "args": [[composer_id]],
            "kwargs": {
                "context": {
                    "lang": "en_IN",
                    "tz": "Asia/Calcutta",
                    "uid": session.uid,
                    "allowed_company_ids": [1],
                    "active_model": "res.partner",
                    "active_id": partner_id,
                    "default_phone": phone
                }
            },
            "method": "action_send_whatsapp_template",
            "model": "whatsapp.composer"
        },
        "id": session._get_next_id()
    }
    url = f"{session.base_url}/web/dataset/call_button/whatsapp.composer/action_send_whatsapp_template"
    headers = session._get_headers()
    response = session.session.post(url, headers=headers, json=payload)
    response.raise_for_status()
    result = response.json()
    logger.info(f"WhatsApp send response: {json.dumps(result, indent=2)}")
    return result

# Initialize Odoo session
try:
    odoo_session = OdooSession(
        base_url='https://testcafe1.odoo.com',
        db='testcafe1',
        username='gunj06saksham@gmail.com',
        password='gunj7250@'
    )
except Exception as e:
    logger.error(f"Failed to initialize Odoo session: {e}")
    odoo_session = None

# WhatsApp Endpoint
@app.post("/api/send-whatsapp")
async def send_whatsapp(
    phone: str = Form(...),
    message1: str = Form(default=""),
    message2: str = Form(default=""),
    message3: str = Form(default="")
):
    if not odoo_session:
        raise HTTPException(status_code=500, detail="Odoo session not initialized")

    try:
        partner_id = 3
        template_id = 2

        if not phone.startswith('+91') and len(phone) == 10:
            formatted_phone = f"+91{phone}"
        elif phone.startswith('+91') and len(phone) == 13:
            formatted_phone = phone
        else:
            raise HTTPException(status_code=400, detail="Invalid phone number. Use 10 digits or +91 followed by 10 digits.")

        variables = {
            "1": message1,
            "2": message2,
            "3": message3
        }

        composer_id = create_whatsapp_composer(odoo_session, partner_id, template_id, formatted_phone, variables)
        if not composer_id:
            raise HTTPException(status_code=500, detail="Failed to create WhatsApp composer")

        send_whatsapp_message(odoo_session, composer_id, partner_id, formatted_phone)
        logger.info(f"WhatsApp message sent to {formatted_phone}")
        return JSONResponse(content={"message": "WhatsApp message sent successfully"})
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        raise HTTPException(status_code=500, detail=f"Error sending WhatsApp message: {str(e)}")