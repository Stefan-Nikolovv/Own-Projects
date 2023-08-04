import * as request from "./requester";

const baseUrl = 'http://localhost:3000/auth';

export const login = (email, password) => 
    request.post(`${baseUrl}/login`, {email, password});


export const register = (username, email, password) =>
    request.post(`${baseUrl}/register`, {username, password, email});