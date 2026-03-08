"""
Backend API tests for i18n expansion, language preference persistence, and notification system.
Focus on:
- User language preference endpoints (GET/PUT /api/user/language)
- Login response includes language field
- Notification CRUD endpoints (POST/GET /api/notifications)
- Notification read status endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Quick health check to validate API is running"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health check passed")


class TestAuthWithLanguage:
    """Test authentication endpoints return language field"""
    
    def test_login_returns_language_field(self):
        """Login response should include 'language' field in user object"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response missing 'token'"
        assert "user" in data, "Response missing 'user'"
        
        user = data["user"]
        assert "language" in user, "User object missing 'language' field"
        print(f"✓ Login returns language field: {user.get('language')}")
        
        return data["token"], user


class TestUserLanguagePreference:
    """Test user language preference endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_get_user_language(self, auth_token):
        """GET /api/user/language should return saved language"""
        response = requests.get(
            f"{BASE_URL}/api/user/language",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"GET language failed: {response.text}"
        
        data = response.json()
        assert "language" in data, "Response missing 'language' field"
        print(f"✓ GET /api/user/language returns: {data['language']}")
        
        return data["language"]
    
    def test_put_user_language_en(self, auth_token):
        """PUT /api/user/language should persist English preference"""
        response = requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "en"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"PUT language failed: {response.text}"
        
        data = response.json()
        assert data.get("status") == "updated", "Response should have status: updated"
        assert data.get("language") == "en", "Response should confirm language: en"
        print("✓ PUT /api/user/language to 'en' successful")
    
    def test_put_user_language_es(self, auth_token):
        """PUT /api/user/language should persist Spanish preference"""
        response = requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "es"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"PUT language failed: {response.text}"
        
        data = response.json()
        assert data.get("language") == "es"
        print("✓ PUT /api/user/language to 'es' successful")
    
    def test_put_user_language_de(self, auth_token):
        """PUT /api/user/language should persist German preference"""
        response = requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "de"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.json().get("language") == "de"
        print("✓ PUT /api/user/language to 'de' successful")
    
    def test_put_user_language_fr(self, auth_token):
        """PUT /api/user/language should persist French preference"""
        response = requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "fr"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.json().get("language") == "fr"
        print("✓ PUT /api/user/language to 'fr' successful")
    
    def test_put_user_language_pt(self, auth_token):
        """PUT /api/user/language should persist Portuguese preference"""
        response = requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "pt"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.json().get("language") == "pt"
        print("✓ PUT /api/user/language to 'pt' successful")
    
    def test_put_user_language_it(self, auth_token):
        """PUT /api/user/language should persist Italian preference"""
        response = requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "it"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.json().get("language") == "it"
        print("✓ PUT /api/user/language to 'it' successful")
    
    def test_put_user_language_ar(self, auth_token):
        """PUT /api/user/language should persist Arabic preference"""
        response = requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "ar"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert response.json().get("language") == "ar"
        print("✓ PUT /api/user/language to 'ar' successful")
    
    def test_language_persistence_roundtrip(self, auth_token):
        """Test that language preference persists: PUT then GET should match"""
        # Set to German
        put_response = requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "de"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert put_response.status_code == 200
        
        # Verify with GET
        get_response = requests.get(
            f"{BASE_URL}/api/user/language",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_response.status_code == 200
        assert get_response.json().get("language") == "de"
        print("✓ Language persistence roundtrip test passed")
        
        # Reset to English for clean state
        requests.put(
            f"{BASE_URL}/api/user/language",
            json={"language": "en"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )


class TestNotificationSystem:
    """Test notification CRUD endpoints (mock parent notification system)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@academy.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_create_notification(self, auth_token):
        """POST /api/notifications should create a notification"""
        response = requests.post(
            f"{BASE_URL}/api/notifications",
            json={
                "subject": "TEST_Notification Subject",
                "message": "This is a test notification message",
                "recipient": "all_parents"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Create notification failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should include notification id"
        assert data["subject"] == "TEST_Notification Subject"
        assert data["message"] == "This is a test notification message"
        assert data["recipient"] == "all_parents"
        assert data["status"] == "sent"
        assert data["email_simulated"] == True, "Email should be simulated (MOCKED)"
        print(f"✓ POST /api/notifications created: {data['id']}")
        
        return data["id"]
    
    def test_get_notifications(self, auth_token):
        """GET /api/notifications should return list of notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"GET notifications failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/notifications returned {len(data)} notifications")
        
        return data
    
    def test_mark_notification_as_read(self, auth_token):
        """PUT /api/notifications/{id}/read should mark notification as read"""
        # First create a notification
        create_response = requests.post(
            f"{BASE_URL}/api/notifications",
            json={
                "subject": "TEST_Read Status Test",
                "message": "Testing mark as read",
                "recipient": "all_parents"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        notif_id = create_response.json()["id"]
        
        # Mark as read
        read_response = requests.put(
            f"{BASE_URL}/api/notifications/{notif_id}/read",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert read_response.status_code == 200, f"Mark as read failed: {read_response.text}"
        assert read_response.json().get("status") == "read"
        print(f"✓ PUT /api/notifications/{notif_id}/read successful")
    
    def test_mark_all_notifications_read(self, auth_token):
        """PUT /api/notifications/read-all should mark all as read"""
        response = requests.put(
            f"{BASE_URL}/api/notifications/read-all",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Mark all read failed: {response.text}"
        assert response.json().get("status") == "all_read"
        print("✓ PUT /api/notifications/read-all successful")
    
    def test_notification_with_team_id(self, auth_token):
        """POST /api/notifications with team_id should work"""
        # Get a team first
        teams_response = requests.get(
            f"{BASE_URL}/api/teams",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if teams_response.status_code == 200 and len(teams_response.json()) > 0:
            team_id = teams_response.json()[0]["id"]
            
            response = requests.post(
                f"{BASE_URL}/api/notifications",
                json={
                    "subject": "TEST_Team Notification",
                    "message": "Notification for specific team",
                    "recipient": "team_parents",
                    "team_id": team_id
                },
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            assert response.json()["team_id"] == team_id
            print(f"✓ Notification with team_id={team_id} created successfully")
        else:
            pytest.skip("No teams available to test team-specific notifications")


class TestLoginLanguageApplied:
    """Test that login response includes saved language and coach credentials work"""
    
    def test_coach_login(self):
        """Coach login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "carlos@academy.com",
            "password": "coach123"
        })
        assert response.status_code == 200, f"Coach login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "coach"
        assert "language" in data["user"]
        print(f"✓ Coach login successful, language: {data['user'].get('language')}")
    
    def test_parent_login(self):
        """Parent login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "parent@academy.com",
            "password": "parent123"
        })
        assert response.status_code == 200, f"Parent login failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "parent"
        assert "language" in data["user"]
        print(f"✓ Parent login successful, language: {data['user'].get('language')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
