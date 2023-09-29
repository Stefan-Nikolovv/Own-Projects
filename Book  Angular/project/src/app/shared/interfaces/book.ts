export interface IBook {
    _id: string,
    author: string,
    title: string,
    description: string,
    imageUrl: string,
    type: string,
    userId: string[],
    created_at: string,
    updatedAt: string,
    __v: number
}