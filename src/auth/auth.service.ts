import { ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }
  async signup(dto: AuthDto) {
    // generate password hash
    const hash = await argon.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          firstName: true,
          lastName: true
        }
      })
      return user;
    } catch (error) {
      // console.log(error)
      if (error instanceof PrismaClientKnownRequestError) {
        throw new ForbiddenException('Credentials taken')
      }
      else {
        throw new ForbiddenException('Credentials taken')
      }
    }
  }

  async login(dto: AuthDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email
      },
    })

    // throw error is user does't exist
    if (!user) throw new ForbiddenException('User does not exist')

    // compare password to hash
    const pwMatches = await argon.verify(user.hash, dto.password)

    // throw exception is password is incorrect
    if (!pwMatches) throw new ForbiddenException('Credetials incorrect')

    delete user.hash
    return user;
  }
}