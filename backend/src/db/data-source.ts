// import 'dotenv/config';
// import { DataSource } from 'typeorm';
// import { BattleEntity } from './entities/battle.entity';
// import { BattleTeamPickEntity } from './entities/battle-team-pick.entity';
// import { TrackedPlayerEntity } from './entities/tracked-player.entity';
// import { BrawlerEntity } from './entities/brawler.entity';

// export default new DataSource({
//     type: 'postgres',
//     url: process.env.DATABASE_URL,
//     ssl: true,
//     extra: { ssl: { rejectUnauthorized: false } },
//     entities: [TrackedPlayerEntity, BattleEntity, BattleTeamPickEntity, BrawlerEntity],
//     migrations: ['src/db/migrations/*.ts'],
// });