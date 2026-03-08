"""
Backend API tests for new features:
- Notifications API (send, list, mark read, mark all read)
- File Upload API (upload, download)
- Dashboard Stats API (for CSV/PDF export data)
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndAuth:
    """Health check and authentication"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✅ Health endpoint working")
    
    def test_admin_login(self):
        """Test admin login returns token and user with correct fields"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@academy.com"
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful, user role: {data['user']['role']}")
        return data["token"]


class TestNotificationsAPI:
    """Test notifications CRUD operations - Emails are MOCKED/simulated"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_create_notification(self, auth_headers):
        """Test creating a notification - Email is MOCKED"""
        response = requests.post(f"{BASE_URL}/api/notifications", 
            headers=auth_headers,
            json={
                "subject": "TEST_New Feature Test",
                "message": "This is a test notification for the new notifications feature",
                "recipient": "all_parents"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["subject"] == "TEST_New Feature Test"
        assert data["recipient"] == "all_parents"
        assert data["email_simulated"] == True  # MOCKED - emails not actually sent
        assert data["status"] == "sent"
        print(f"✅ Notification created with id: {data['id']}, email_simulated: {data['email_simulated']}")
        return data["id"]
    
    def test_list_notifications(self, auth_headers):
        """Test listing notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Retrieved {len(data)} notifications")
        # Verify structure of notifications
        if len(data) > 0:
            notif = data[0]
            assert "id" in notif
            assert "subject" in notif
            assert "message" in notif
            assert "is_read" in notif
            print(f"✅ Notification structure verified: subject={notif['subject'][:30]}...")
    
    def test_mark_notification_read(self, auth_headers):
        """Test marking a notification as read"""
        # First create a notification
        create_resp = requests.post(f"{BASE_URL}/api/notifications",
            headers=auth_headers,
            json={"subject": "TEST_Mark Read Test", "message": "Testing mark as read", "recipient": "all_parents"}
        )
        notif_id = create_resp.json()["id"]
        
        # Mark as read
        response = requests.put(f"{BASE_URL}/api/notifications/{notif_id}/read", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "read"
        print(f"✅ Notification {notif_id} marked as read")
        
        # Verify by fetching notifications
        list_resp = requests.get(f"{BASE_URL}/api/notifications", headers=auth_headers)
        notif = next((n for n in list_resp.json() if n["id"] == notif_id), None)
        assert notif is not None
        assert notif["is_read"] == True
        print("✅ Verified notification is_read=True after marking")
    
    def test_mark_all_notifications_read(self, auth_headers):
        """Test marking all notifications as read"""
        response = requests.put(f"{BASE_URL}/api/notifications/read-all", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "all_read"
        print("✅ All notifications marked as read")
    
    def test_notification_with_team(self, auth_headers):
        """Test creating notification for specific team"""
        # Get teams first
        teams_resp = requests.get(f"{BASE_URL}/api/teams", headers=auth_headers)
        teams = teams_resp.json()
        if len(teams) > 0:
            team_id = teams[0]["id"]
            response = requests.post(f"{BASE_URL}/api/notifications",
                headers=auth_headers,
                json={
                    "subject": "TEST_Team Notification",
                    "message": "Message for specific team",
                    "recipient": "team_parents",
                    "team_id": team_id
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert data["team_id"] == team_id
            assert data["recipient"] == "team_parents"
            print(f"✅ Team-specific notification created for team: {team_id}")


class TestFileUploadAPI:
    """Test file upload and download endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get auth headers without Content-Type for multipart"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_upload_image_file(self, auth_headers):
        """Test uploading an image file"""
        # Create a simple PNG image bytes (1x1 red pixel)
        import struct
        import zlib
        
        def create_minimal_png():
            # PNG signature
            signature = b'\x89PNG\r\n\x1a\n'
            # IHDR chunk
            width = 1
            height = 1
            bit_depth = 8
            color_type = 2  # RGB
            ihdr_data = struct.pack('>IIBBBBB', width, height, bit_depth, color_type, 0, 0, 0)
            ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
            ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
            # IDAT chunk (compressed image data - 1 red pixel)
            raw_data = b'\x00\xff\x00\x00'  # filter byte + RGB
            compressed = zlib.compress(raw_data)
            idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
            idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
            # IEND chunk
            iend_crc = zlib.crc32(b'IEND') & 0xffffffff
            iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
            
            return signature + ihdr + idat + iend
        
        png_data = create_minimal_png()
        files = {'file': ('test_image.png', io.BytesIO(png_data), 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/upload", headers=auth_headers, files=files)
        assert response.status_code == 200
        data = response.json()
        assert "file_id" in data
        assert "storage_path" in data
        assert "url" in data
        print(f"✅ File uploaded successfully: storage_path={data['storage_path']}")
        return data
    
    def test_download_uploaded_file(self, auth_headers):
        """Test downloading an uploaded file"""
        # First upload a file
        import struct
        import zlib
        
        def create_minimal_png():
            signature = b'\x89PNG\r\n\x1a\n'
            width, height = 1, 1
            ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
            ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
            ihdr = struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
            raw_data = b'\x00\xff\x00\x00'
            compressed = zlib.compress(raw_data)
            idat_crc = zlib.crc32(b'IDAT' + compressed) & 0xffffffff
            idat = struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
            iend_crc = zlib.crc32(b'IEND') & 0xffffffff
            iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
            return signature + ihdr + idat + iend
        
        png_data = create_minimal_png()
        files = {'file': ('download_test.png', io.BytesIO(png_data), 'image/png')}
        upload_resp = requests.post(f"{BASE_URL}/api/upload", headers=auth_headers, files=files)
        storage_path = upload_resp.json()["storage_path"]
        
        # Download using query param auth
        token = auth_headers["Authorization"].split(" ")[1]
        response = requests.get(f"{BASE_URL}/api/files/{storage_path}?auth={token}")
        assert response.status_code == 200
        assert response.headers.get("Content-Type", "").startswith("image/")
        print(f"✅ File downloaded successfully, content-type: {response.headers.get('Content-Type')}")
    
    def test_upload_invalid_file_type(self, auth_headers):
        """Test uploading invalid file type is rejected"""
        files = {'file': ('test.exe', io.BytesIO(b'invalid data'), 'application/octet-stream')}
        response = requests.post(f"{BASE_URL}/api/upload", headers=auth_headers, files=files)
        assert response.status_code == 400
        data = response.json()
        assert "not allowed" in data.get("detail", "").lower()
        print("✅ Invalid file type correctly rejected")
    
    def test_upload_without_auth_fails(self):
        """Test upload without auth returns 401"""
        files = {'file': ('test.png', io.BytesIO(b'data'), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 401
        print("✅ Upload without auth correctly returns 401")


class TestDashboardStatsAPI:
    """Test dashboard stats API - used for CSV/PDF export"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_dashboard_stats_endpoint(self, auth_headers):
        """Test dashboard stats for export data"""
        response = requests.get(f"{BASE_URL}/api/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify stats fields exist
        assert "total_players" in data
        assert "total_teams" in data
        assert "active_players" in data
        assert "injured_players" in data
        assert "players_by_category" in data
        print(f"✅ Dashboard stats: {data['total_players']} players, {data['total_teams']} teams")
    
    def test_players_list_for_csv_export(self, auth_headers):
        """Test players list endpoint - used for CSV export"""
        response = requests.get(f"{BASE_URL}/api/players", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Players list for CSV export: {len(data)} players")
        
        # Verify player structure for CSV export
        if len(data) > 0:
            player = data[0]
            required_fields = ["first_name", "last_name", "position", "category", "status"]
            for field in required_fields:
                assert field in player, f"Missing field: {field}"
            print("✅ Player data structure verified for CSV export")


class TestSettingsAPI:
    """Test settings API - for club logo upload"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_settings(self, auth_headers):
        """Test getting club settings"""
        response = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "id" in data
        print(f"✅ Club settings retrieved: {data['name']}")
    
    def test_update_settings_logo_url(self, auth_headers):
        """Test updating settings with logo_url"""
        # First get current settings
        get_resp = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        current = get_resp.json()
        
        # Update with a test logo_url
        response = requests.put(f"{BASE_URL}/api/settings", 
            headers=auth_headers,
            json={"logo_url": "test/path/logo.png"}
        )
        assert response.status_code == 200
        
        # Verify update
        verify_resp = requests.get(f"{BASE_URL}/api/settings", headers=auth_headers)
        updated = verify_resp.json()
        assert updated.get("logo_url") == "test/path/logo.png"
        print("✅ Settings logo_url updated successfully")
        
        # Restore original
        requests.put(f"{BASE_URL}/api/settings", 
            headers=auth_headers,
            json={"logo_url": current.get("logo_url", "")}
        )


class TestPlayerPhotoAPI:
    """Test player photo upload via player update"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_update_player_photo_url(self, auth_headers):
        """Test updating player with photo_url"""
        # Get a player
        players_resp = requests.get(f"{BASE_URL}/api/players", headers=auth_headers)
        players = players_resp.json()
        if len(players) > 0:
            player_id = players[0]["id"]
            original_photo = players[0].get("photo_url", "")
            
            # Update photo_url
            response = requests.put(f"{BASE_URL}/api/players/{player_id}",
                headers=auth_headers,
                json={"photo_url": "test/player/photo.png"}
            )
            assert response.status_code == 200
            
            # Verify
            verify_resp = requests.get(f"{BASE_URL}/api/players/{player_id}", headers=auth_headers)
            assert verify_resp.status_code == 200
            updated = verify_resp.json()
            assert updated.get("photo_url") == "test/player/photo.png"
            print(f"✅ Player photo_url updated for player: {player_id}")
            
            # Restore
            requests.put(f"{BASE_URL}/api/players/{player_id}",
                headers=auth_headers,
                json={"photo_url": original_photo}
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
