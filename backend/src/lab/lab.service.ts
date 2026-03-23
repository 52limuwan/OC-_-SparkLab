import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lab } from './entities/lab.entity';

@Injectable()
export class LabService {
  constructor(
    @InjectRepository(Lab)
    private labRepository: Repository<Lab>,
  ) {}

  async findAll() {
    return this.labRepository.find();
  }

  async findOne(id: string) {
    return this.labRepository.findOne({ where: { id } });
  }

  async create(labData: Partial<Lab>) {
    const lab = this.labRepository.create(labData);
    return this.labRepository.save(lab);
  }
}
