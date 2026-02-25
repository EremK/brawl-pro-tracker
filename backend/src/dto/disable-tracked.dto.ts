import { ApiProperty } from '@nestjs/swagger';

export class DisableTrackedDto {
    @ApiProperty({ example: '#92QGPQQJ' })
    tag!: string;
}