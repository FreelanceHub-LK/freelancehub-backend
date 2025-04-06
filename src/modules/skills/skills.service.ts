import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill, SkillDocument } from './schemas/skill.schema';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
  ) {}

  async create(createSkillDto: CreateSkillDto): Promise<Skill> {
    try {
      const createdSkill = new this.skillModel(createSkillDto);
      return await createdSkill.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Skill with this name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Skill[]> {
    return this.skillModel.find().populate('category', 'name').exec();
  }

  async findOne(id: string): Promise<Skill> {
    const skill = await this.skillModel.findById(id).populate('category', 'name').exec();
    
    if (!skill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    
    return skill;
  }

  async findByName(name: string): Promise<Skill[]> {
    return this.skillModel.find({ 
      name: { $regex: name, $options: 'i' } 
    }).populate('category', 'name').exec();
  }

  async findByCategory(categoryId: string): Promise<Skill[]> {
    return this.skillModel.find({ category: categoryId }).exec();
  }

  async update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill> {
    try {
      const updatedSkill = await this.skillModel
        .findByIdAndUpdate(id, updateSkillDto, { new: true })
        .exec();
      
      if (!updatedSkill) {
        throw new NotFoundException(`Skill with ID ${id} not found`);
      }
      
      return updatedSkill;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Skill with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<boolean> {
    const deletedSkill = await this.skillModel.findByIdAndDelete(id).exec();
    
    if (!deletedSkill) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }
    
    return true;
  }

  async incrementPopularity(skillId: string): Promise<void> {
    await this.skillModel.findByIdAndUpdate(
      skillId,
      { $inc: { popularity: 1 } },
      { new: true }
    ).exec();
  }

  async getPopularSkills(limit: number = 10): Promise<Skill[]> {
    return this.skillModel
      .find()
      .sort({ popularity: -1 })
      .limit(limit)
      .populate('category', 'name')
      .exec();
  }
}