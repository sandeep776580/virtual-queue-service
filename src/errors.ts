export class AppError extends Error { constructor(public statusCode:number,message:string,public code="APP_ERROR"){super(message)} }
export const notFound=(m:string)=>new AppError(404,m,"NOT_FOUND");
export const conflict=(m:string)=>new AppError(409,m,"CONFLICT");
