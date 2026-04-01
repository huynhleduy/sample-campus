import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import UserEntity from '@src/modules/user/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
