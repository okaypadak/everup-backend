import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      password: passwordHash,
    });
    return this.userRepo.save(user);
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async onModuleInit() {

    const adminExists = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });

    if (!adminExists) {
      const adminUser: CreateUserDto = {
        username: 'admin',
        email: 'kypdkz@gmail.com',
        password: 'padaK06##',
        role: UserRole.ADMIN,
        firstName: 'Okay',
        lastName: 'Padak',
      };

      await this.create(adminUser);
      console.log('✅ Admin kullanıcısı oluşturuldu');
    } else {
      console.log('ℹ️ Admin zaten mevcut');
    }
  }
}
