import * as request from "./requester";

const baseUrl = 'http://localhost:3000/publication';


export const getAll = (location, offset) => request.get(`${baseUrl}/catalog${location}?offset=${offset}`);

export const getShoes = () => request.get(`${baseUrl}/catalog`);

export const getWatches = () => request.get(`${baseUrl}/catalog`);

export const getWatchesFiltered = (color, data) => request.get(`${baseUrl}/catalog/${color}/${data}`);