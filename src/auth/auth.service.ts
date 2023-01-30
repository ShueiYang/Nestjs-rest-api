import { ForbiddenException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt/dist/jwt.service.js";
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/index.js";

import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuthDto } from "./dto/auth.dto.js";


@Injectable()
export class AuthService {
    constructor (
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
    ) {}

        async signUp(dto: AuthDto) {
            //generate the password hash
            const hash = await argon2.hash(dto.password);
            //save the new user in the db
            try {
                const user = await this.prisma.user.create({
                    data: {
                        email: dto.email,
                        hash,
                    },
                })
            //return the saved user's Token
                return this.signToken(user.id, user.email);
            
            } catch (error) {
                if(error instanceof PrismaClientKnownRequestError) {
                    if(error.code === 'P2002') {
                        throw new ForbiddenException(
                            'Email already taken'
                        )
                    }
                    throw error;
                }
            }
        };

        async signIn(dto: AuthDto) {
            try {   // find the user by email
                const user = await this.prisma.user.findUnique({
                    where: {
                        email: dto.email
                    } 
                })
                // if user does not exist throw exception
                if(!user) throw new ForbiddenException(
                    'Wrong Email or Password'
                );
                // compare password
                const pwMatched = await argon2.verify(user.hash, dto.password);
                // if password incorrect throw error
                if(!pwMatched) throw new ForbiddenException(
                    'Wrong Email or Password'
                );
                // send back the user's Token
                return this.signToken(user.id, user.email);
            
            } catch (error) {
                throw error
            }
        }
        
        async signToken(userId: number, email: string): Promise<{access_token: string}> {
            const payload = {
                sub: userId,
                email,
            }
            const token = await this.jwt.signAsync(payload, {
                secret: this.config.get('JWT_SECRET'),
                expiresIn: '15m', 
            })
            return {
                access_token: token
            }
        }
}