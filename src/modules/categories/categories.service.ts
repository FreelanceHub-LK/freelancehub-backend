import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const createdCategory = new this.categoryModel(createCategoryDto);
      return await createdCategory.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().populate('parent', 'name').exec();
  }

  async findActive(): Promise<Category[]> {
    return this.categoryModel.find({ isActive: true }).populate('parent', 'name').exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).populate('parent', 'name').exec();
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return category;
  }

  async findByName(name: string): Promise<Category[]> {
    return this.categoryModel.find({ 
      name: { $regex: name, $options: 'i' } 
    }).populate('parent', 'name').exec();
  }

  async findMainCategories(): Promise<Category[]> {
    return this.categoryModel.find({ parent: null, isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async findSubCategories(parentId: string): Promise<Category[]> {
    return this.categoryModel.find({ parent: parentId, isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      const updatedCategory = await this.categoryModel
        .findByIdAndUpdate(id, updateCategoryDto, { new: true })
        .exec();
      
      if (!updatedCategory) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      
      return updatedCategory;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<boolean> {
    // Check if there are subcategories using this as parent
    const hasSubCategories = await this.categoryModel.exists({ parent: id });
    
    if (hasSubCategories) {
      throw new ConflictException('Cannot delete category with existing subcategories');
    }
    
    const deletedCategory = await this.categoryModel.findByIdAndDelete(id).exec();
    
    if (!deletedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return true;
  }

  async deactivate(id: string): Promise<Category> {
    const category = await this.categoryModel.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    ).exec();
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return category;
  }

  async activate(id: string): Promise<Category> {
    const category = await this.categoryModel.findByIdAndUpdate(
      id, 
      { isActive: true }, 
      { new: true }
    ).exec();
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    return category;
  }
}
