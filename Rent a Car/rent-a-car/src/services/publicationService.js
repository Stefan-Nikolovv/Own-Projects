import * as request from "./requester";

const baseUrl = 'http://localhost:3000/publication';


export const getAll = () => request.get(`${baseUrl}/catalog`);

export const getOne = (itemID) => request.get(`${baseUrl}/details/${itemID}`);

export const editOne = (itemID) => request.get(`${baseUrl}/edit/${itemID}`);