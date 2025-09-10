export interface RegisterDto {
    username: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface TokenData {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenDto {
    refreshToken: string;
}