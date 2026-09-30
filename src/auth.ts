import jwt from "jsonwebtoken"; import {Request,Response,NextFunction} from "express";
export interface AuthContext {tenantId:string; role:"staff"|"customer"; subject:string}
declare global {namespace Express {interface Request {auth?:AuthContext}}}
const secret=process.env.JWT_SECRET??"assessment-secret", issuer=process.env.JWT_ISSUER??"virtual-queue-service";
export function createTestToken(c:AuthContext){return jwt.sign(c,secret,{issuer,expiresIn:"1h",subject:c.subject})}
export function authenticate(req:Request,res:Response,next:NextFunction){const h=req.header("Authorization");if(!h?.startsWith("Bearer "))return res.status(401).json({error:"UNAUTHORIZED"});try{const p=jwt.verify(h.slice(7),secret,{issuer}) as jwt.JwtPayload;if(typeof p.tenantId!=="string"||(p.role!=="staff"&&p.role!=="customer")||typeof p.sub!=="string")throw 0;req.auth={tenantId:p.tenantId,role:p.role,subject:p.sub};next()}catch{return res.status(401).json({error:"UNAUTHORIZED",message:"Invalid token"})}}
export function requireStaff(req:Request,res:Response,next:NextFunction){if(req.auth?.role!=="staff")return res.status(403).json({error:"FORBIDDEN",message:"Staff role required"});next()}
