class AuthManager {
    static getToken() {
        return localStorage.getItem('token');
    }

    static getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    static async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            this.logout();
            return;
        }

        const authOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, authOptions);
            
            if (response.status === 401) {
                this.logout();
                return;
            }

            return response;
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }
}

// Update navbar based on authentication status
function updateNavbar() {
    const navbarContent = document.getElementById('navbar-content');
    if (AuthManager.isAuthenticated()) {
        const user = AuthManager.getUser();
        navbarContent.innerHTML = `
            <a class="nav-link" href="/dashboard">Dashboard</a>
            <div class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    ${user.firstName} ${user.lastName}
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="AuthManager.logout()">Logout</a></li>
                </ul>
            </div>
        `;
    } else {
        navbarContent.innerHTML = `
            <a class="nav-link" href="/login">Login</a>
            <a class="nav-link" href="/register">Register</a>
        `;
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    
    // Redirect to dashboard if authenticated and on home/login/register page
    if (AuthManager.isAuthenticated()) {
        const path = window.location.pathname;
        if (path === '/' || path === '/login' || path === '/register') {
            window.location.href = '/dashboard';
        }
    }
    
    // Redirect to login if not authenticated and on dashboard
    if (!AuthManager.isAuthenticated() && window.location.pathname === '/dashboard') {
        window.location.href = '/login';
    }
});