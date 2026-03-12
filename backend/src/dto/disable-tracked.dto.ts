import { ApiProperty } from '@nestjs/swagger';

export class DisableTrackedDto {
    @ApiProperty({ example: '#8J2LQ9RP' })
    tag!: string;
}
