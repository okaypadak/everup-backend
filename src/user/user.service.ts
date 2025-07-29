import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { CustomMailService } from '../mail/mail.service';
import { MessageDto } from '../common/dto/message.dto';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: CustomMailService,
  ) {}

  async onModuleInit() {

    const adminExists = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });

    if (!adminExists) {

      const adminUser: CreateUserDto = {
        email: 'padakyazilim@gmail.com',
        password: 'padaK06##',
        role: UserRole.ADMIN,
        firstName: 'Okay',
        lastName: 'Padak'
      };

      await this.create(adminUser);
      console.log('✅ Admin kullanıcısı oluşturuldu');
    }
  }

  async create(dto: CreateUserDto): Promise<MessageDto> {
    const password = dto.password || this.generatePassword()
    const passwordHash = await bcrypt.hash(password, 10)

    const user = this.userRepo.create({
      ...dto,
      password: passwordHash,
    })

    const savedUser = await this.userRepo.save(user)

    // Mail gönderimi
    await this.mailService.sendPasswordEmail(savedUser.email, password)

    return new MessageDto('İşlem başarılı', '00')
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }


  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.userRepo.find();
    return users.map((user) => new ResponseUserDto(user));
  }

  private generatePassword(): string {
    const part = Math.random().toString(36).slice(-8)
    return part + 'A#'
  }

  async updateUserRole(userId: number, newRole: UserRole): Promise<MessageDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    user.role = newRole;
    await this.userRepo.save(user);

    return new MessageDto('Rol başarıyla güncellendi', '00');
  }
}
