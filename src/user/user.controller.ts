import { Controller, Get, Body, UseGuards, Patch } from '@nestjs/common';
import { JwtGuard } from '../auth/guard/jwt.guard.js';

import { GetUser } from '../auth/decorator/getuser.decorator.js';
import { User } from '@prisma/client';
import { EditUserDto } from './dto/edit-user.dto.js';
import { UserService } from './user.service.js';



@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
    constructor(private userService: UserService) {}
    
    @Get('me')
    getMe(@GetUser() user: User) {
        return user;
    }

    @Patch()
    editUser(
        @GetUser('id') userId: number,
        @Body() dto: EditUserDto
    ) {
        return this.userService.editUser(userId, dto)
    }
}
