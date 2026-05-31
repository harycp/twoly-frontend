export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar_url?: string | null;
    last_seen?: string | null;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

export interface LoginRequest {
    email_or_username: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    username: string;
    email: string;
    password: string;
}

export interface UpdateProfileRequest {
    name: string;
    username?: string;
    avatar_url?: string | null;
    avatar?: File;
}