import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;

    const newUser = new this.userModel(userData);

    if (password) {
      const salt = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, salt);
    }

    return newUser.save();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { password, ...updateData } = updateUserDto;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData['password'] = await bcrypt.hash(password, salt);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return deletedUser;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user || !user.password) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  }

  async updateLastLogin(id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { lastLogin: new Date() }, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByFilters(filters: Record<string, any>): Promise<User[]> {
    return this.userModel.find(filters).exec();
  }

  async countDocuments(filters: Record<string, any> = {}): Promise<number> {
    return this.userModel.countDocuments(filters).exec();
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters: Record<string, any> = {},
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel.find(filters).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(filters).exec(),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
