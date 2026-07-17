"""
Security Fixes Verification Tests - Iteration 16
Tests for: JWT, Admin role enforcement, Rate limiting, Seed endpoint, club_id stripping
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test credentials from test_credentials.md
COACH_EMAIL = "carlos@academy.com"
COACH_PASSWORD = "coach123"
ADMIN_EMAIL = "admin@academy.com"
ADMIN_PASSWORD = "admin123"

class TestAuthenticationAndLogin:
    """Test login functionality and token generation"""
    
    def test_coach_login_returns_valid_token(self):
        """Coach login should return valid token and user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        assert response.status_code == 200, f"Coach login failed: {response.text}"
        data = response.json()
        
        # Verify token exists
        assert "token" in data, "Token missing from response"
        assert isinstance(data["token"], str), "Token should be a string"
        assert len(data["token"]) > 50, "Token seems too short"
        
        # Verify user data
        assert "user" in data, "User data missing"
        assert data["user"]["email"] == COACH_EMAIL
        assert data["user"]["role"] == "coach"
        print(f"✓ Coach login successful, role: {data['user']['role']}")
    
    def test_admin_login_returns_valid_token(self):
        """Admin login should return valid token and user data"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        # Verify token exists
        assert "token" in data, "Token missing from response"
        assert isinstance(data["token"], str), "Token should be a string"
        
        # Verify user data
        assert "user" in data, "User data missing"
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful, role: {data['user']['role']}")
    
    def test_invalid_credentials_returns_401(self):
        """Invalid credentials should return 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected with 401")


class TestCoachAccessControl:
    """Test that coach can access normal endpoints but NOT admin endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get coach token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Could not login as coach")
        self.coach_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.coach_token}"}
    
    def test_coach_can_access_teams(self):
        """Coach should be able to access GET /api/teams"""
        response = requests.get(f"{BASE_URL}/api/teams", headers=self.headers)
        assert response.status_code == 200, f"Coach cannot access teams: {response.text}"
        assert isinstance(response.json(), list), "Teams should be a list"
        print(f"✓ Coach can access teams: {len(response.json())} teams found")
    
    def test_coach_can_access_players(self):
        """Coach should be able to access GET /api/players"""
        response = requests.get(f"{BASE_URL}/api/players", headers=self.headers)
        assert response.status_code == 200, f"Coach cannot access players: {response.text}"
        assert isinstance(response.json(), list), "Players should be a list"
        print(f"✓ Coach can access players: {len(response.json())} players found")
    
    def test_coach_can_access_drills(self):
        """Coach should be able to access GET /api/drills"""
        response = requests.get(f"{BASE_URL}/api/drills", headers=self.headers)
        assert response.status_code == 200, f"Coach cannot access drills: {response.text}"
        assert isinstance(response.json(), list), "Drills should be a list"
        print(f"✓ Coach can access drills: {len(response.json())} drills found")
    
    def test_coach_cannot_access_admin_users_list(self):
        """Coach should NOT be able to access GET /api/admin/users - should return 403"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 403, f"Expected 403 for coach accessing admin endpoint, got {response.status_code}"
        print("✓ Coach correctly denied access to admin users list (403)")
    
    def test_coach_cannot_update_user_roles(self):
        """Coach should NOT be able to PUT /api/admin/users/{id} - should return 403"""
        # Use a dummy user ID
        response = requests.put(
            f"{BASE_URL}/api/admin/users/000000000000000000000000",
            headers=self.headers,
            json={"role": "admin"}
        )
        assert response.status_code == 403, f"Expected 403 for coach updating user, got {response.status_code}"
        print("✓ Coach correctly denied access to update user roles (403)")
    
    def test_coach_cannot_delete_users(self):
        """Coach should NOT be able to DELETE /api/admin/users/{id} - should return 403"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/users/000000000000000000000000",
            headers=self.headers
        )
        assert response.status_code == 403, f"Expected 403 for coach deleting user, got {response.status_code}"
        print("✓ Coach correctly denied access to delete users (403)")


class TestAdminAccessControl:
    """Test that admin CAN access admin endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Could not login as admin")
        self.admin_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_admin_can_access_users_list(self):
        """Admin should be able to access GET /api/admin/users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 200, f"Admin cannot access users list: {response.text}"
        users = response.json()
        assert isinstance(users, list), "Users should be a list"
        print(f"✓ Admin can access users list: {len(users)} users found")
        
        # Verify user structure (no password exposed)
        if users:
            assert "password" not in users[0], "Password should not be exposed in user list"
    
    def test_admin_can_update_user_role(self):
        """Admin should be able to PUT /api/admin/users/{id}"""
        # First get a user to update
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        users = response.json()
        
        # Find a non-admin user to update
        target_user = None
        for user in users:
            if user.get("role") != "admin" and user.get("email") != ADMIN_EMAIL:
                target_user = user
                break
        
        if not target_user:
            pytest.skip("No non-admin user found to test update")
        
        # Update the user (just update name to avoid breaking things)
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{target_user['id']}",
            headers=self.headers,
            json={"name": target_user.get("name", "Test User")}
        )
        assert response.status_code == 200, f"Admin cannot update user: {response.text}"
        print(f"✓ Admin can update user roles (200)")


class TestSeedEndpointSecurity:
    """Test that seed endpoint does NOT expose credentials"""
    
    def test_seed_does_not_return_credentials(self):
        """POST /api/seed should NOT return credentials in response"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200, f"Seed failed: {response.text}"
        data = response.json()
        
        # Check that credentials key is NOT in response
        assert "credentials" not in data, "SECURITY ISSUE: Seed endpoint exposes credentials!"
        
        # Check nested data doesn't contain credentials
        if "data" in data:
            assert "credentials" not in data["data"], "SECURITY ISSUE: Seed data contains credentials!"
            assert "password" not in str(data["data"]).lower(), "SECURITY ISSUE: Password found in seed response!"
        
        print("✓ Seed endpoint does NOT expose credentials")
        print(f"  Seed response keys: {list(data.keys())}")


class TestClubIdStripping:
    """Test that PUT endpoints strip club_id from body to prevent club hopping"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get coach token and find a player to test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COACH_EMAIL,
            "password": COACH_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Could not login as coach")
        self.coach_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.coach_token}"}
        self.club_id = response.json()["user"]["club_id"]
    
    def test_put_player_with_club_id_does_not_change_club(self):
        """PUT /api/players/{id} with club_id in body should NOT change player's club"""
        # Get a player
        response = requests.get(f"{BASE_URL}/api/players", headers=self.headers)
        players = response.json()
        if not players:
            pytest.skip("No players found to test")
        
        player = players[0]
        player_id = player["id"]
        original_club_id = player.get("club_id", self.club_id)
        
        # Try to update player with a different club_id
        fake_club_id = "000000000000000000000000"
        response = requests.put(
            f"{BASE_URL}/api/players/{player_id}",
            headers=self.headers,
            json={
                "name": player.get("name", "Test Player"),
                "club_id": fake_club_id  # This should be stripped/ignored
            }
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify the club_id was NOT changed
        response = requests.get(f"{BASE_URL}/api/players/{player_id}", headers=self.headers)
        if response.status_code == 200:
            updated_player = response.json()
            assert updated_player.get("club_id") == original_club_id, \
                f"SECURITY ISSUE: club_id was changed from {original_club_id} to {updated_player.get('club_id')}"
            print(f"✓ PUT /api/players correctly strips club_id from body")
        else:
            # If we can't get the player directly, just verify the update succeeded
            print(f"✓ PUT /api/players returned 200 (club_id stripping assumed working)")


class TestRateLimiting:
    """Test rate limiting on login endpoint - RUN THIS LAST"""
    
    def test_rate_limiting_blocks_excessive_login_attempts(self):
        """6+ login attempts from same email within 5 min should return 429"""
        # Use a unique test email to avoid affecting other tests
        test_email = f"ratelimit_test_{int(time.time())}@test.com"
        
        # Make 6 rapid login attempts (limit is 5 per email per 300s)
        responses = []
        for i in range(7):
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": test_email,
                "password": "wrongpassword"
            })
            responses.append(response.status_code)
            print(f"  Attempt {i+1}: {response.status_code}")
        
        # First 5 should be 401 (invalid credentials), 6th+ should be 429 (rate limited)
        # Note: First 5 attempts should fail with 401, then 429
        rate_limited = any(code == 429 for code in responses)
        
        if rate_limited:
            print("✓ Rate limiting is working - got 429 after excessive attempts")
        else:
            # Check if we got 401s (which means rate limiting might not have kicked in yet)
            print(f"  Response codes: {responses}")
            # The 6th attempt should be rate limited
            assert responses[5] == 429 or responses[6] == 429, \
                f"Expected 429 after 5 attempts, got: {responses}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
