import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
import configparser
from werkzeug.utils import secure_filename

# Load config from .ini file (same pattern as db.py)
CONFIG_PATH = os.path.join(os.path.dirname(__file__), ".ini")
config = configparser.ConfigParser()
config.read(CONFIG_PATH)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024


def configure_cloudinary():
    # Try to get from .ini first, fallback to environment variables
    cloud_name = None
    api_key = None
    api_secret = None

    if config.has_option("PROD", "CLOUDINARY_CLOUD_NAME"):
        cloud_name = config.get("PROD", "CLOUDINARY_CLOUD_NAME")
        api_key = config.get("PROD", "CLOUDINARY_API_KEY")
        api_secret = config.get("PROD", "CLOUDINARY_API_SECRET")
    else:
        cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
        api_key = os.getenv('CLOUDINARY_API_KEY')
        api_secret = os.getenv('CLOUDINARY_API_SECRET')

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_image(file, folder='itubnb/listings'):
    try:
        if not file or file.filename == '':
            return {'success': False, 'error': 'No file provided'}

        if not allowed_file(file.filename):
            return {'success': False, 'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}

        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        if file_length > MAX_FILE_SIZE:
            return {'success': False, 'error': 'File too large. Maximum size: 5MB'}
        file.seek(0)

        configure_cloudinary()

        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type='image',
            transformation=[
                {'width': 1200, 'height': 800, 'crop': 'limit'},
                {'quality': 'auto:good'},
                {'fetch_format': 'auto'}
            ]
        )

        return {
            'success': True,
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'width': result.get('width'),
            'height': result.get('height'),
            'format': result.get('format')
        }

    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        return {'success': False, 'error': f'Upload failed: {str(e)}'}


def upload_multiple_images(files, folder='itubnb/listings'):
    uploaded = []
    failed = []

    for file in files:
        result = upload_image(file, folder)
        if result['success']:
            uploaded.append(result['url'])
        else:
            failed.append({'filename': file.filename, 'error': result['error']})

    return {
        'success': len(failed) == 0,
        'uploaded': uploaded,
        'failed': failed,
        'total': len(files),
        'uploaded_count': len(uploaded),
        'failed_count': len(failed)
    }


def delete_image(public_id):
    try:
        configure_cloudinary()
        result = cloudinary.uploader.destroy(public_id)
        return {'success': result.get('result') == 'ok'}
    except Exception as e:
        return {'success': False, 'error': str(e)}


LOCAL_UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads', 'listings')


def upload_image_local(file):
    try:
        if not file or file.filename == '':
            return {'success': False, 'error': 'No file provided'}

        if not allowed_file(file.filename):
            return {'success': False, 'error': 'Invalid file type'}

        os.makedirs(LOCAL_UPLOAD_FOLDER, exist_ok=True)

        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(file.filename)
        unique_filename = f"{timestamp}_{filename}"

        filepath = os.path.join(LOCAL_UPLOAD_FOLDER, unique_filename)
        file.save(filepath)

        url = f"http://127.0.0.1:5000/uploads/listings/{unique_filename}"

        return {
            'success': True,
            'url': url,
            'public_id': unique_filename,
            'local': True
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}
