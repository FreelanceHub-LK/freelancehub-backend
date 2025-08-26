import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export class ValidationUtil {
  /**
   * Validates if a string is a valid MongoDB ObjectId
   * @param id - The string to validate
   * @param fieldName - The name of the field for error messages (default: 'ID')
   * @throws BadRequestException if the ID is invalid
   */
  static validateObjectId(id: string, fieldName: string = 'ID'): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName}. Must be a valid ObjectId.`);
    }
  }

  /**
   * Validates multiple ObjectIds
   * @param ids - Array of strings to validate
   * @param fieldName - The name of the field for error messages (default: 'ID')
   * @throws BadRequestException if any ID is invalid
   */
  static validateObjectIds(ids: string[], fieldName: string = 'ID'): void {
    const invalidIds = ids.filter(id => !Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid ${fieldName}(s): ${invalidIds.join(', ')}. Must be valid ObjectIds.`
      );
    }
  }

  /**
   * Checks if a string is a valid MongoDB ObjectId without throwing
   * @param id - The string to validate
   * @returns boolean indicating if the ID is valid
   */
  static isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
  }
}
