import * as request from "./requester";

const baseUrl = 'http://localhost:3000/publication';


export const getAll = (location) => request.get(`${baseUrl}/catalog${location}`);

export const getShoes = () => request.get(`${baseUrl}/catalog`);

export const getWatches = () => request.get(`${baseUrl}/catalog`);

export const getWatchesFiltered = (color, data) => request.get(`${baseUrl}/catalog/${color}/${data}`);