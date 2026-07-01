import os
import sys
print(f'Current directory: {os.getcwd()}')
# Simulate what api/index.py does
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(backend_dir))
print(f'After path insert: {sys.path[:3]}...')
try:
    from app.main import app
    print('Successfully imported app from app.main')
    print(f'App type: {type(app)}')
except Exception as e:
    print(f'Failed to import app: {e}')
    import traceback
    traceback.print_exc()

# Test importing from api/index.py directly
try:
    from api.index import app as imported_app, handler
    print('Successfully imported from api.index')
    print(f'App type: {type(imported_app)}')
    print(f'Handler is app: {handler is app}')
except Exception as e:
    print(f'Failed to import from api.index: {e}')
    import traceback
    traceback.print_exc()
