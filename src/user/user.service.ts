import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EditUserDto } from './dto/edit-user.dto.js';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) {}
    
    async editUser(userId: number, dto: EditUserDto) {
        const user = await this.prisma.user.update({
            where: {
                id: userId
            },
            data : {
                ...dto,
            }
        })
        delete user.hash
        return user;
    }
}
