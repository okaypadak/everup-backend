import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../../src/app.module';
import { User, UserRole } from '../../src/user/user.entity';
import { Project } from '../../src/project/project.entity';
import { ProjectUser, ProjectRole } from '../../src/project/project-user.entity';
import { Meeting } from '../../src/meeting/meeting.entity';

describe('Meeting creation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let project: Project;
  let creator: User;
  let member: User;
  let token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    const userRepo = dataSource.getRepository(User);
    const projectRepo = dataSource.getRepository(Project);
    const projectUserRepo = dataSource.getRepository(ProjectUser);
    const meetingRepo = dataSource.getRepository(Meeting);

    await projectUserRepo.delete({});
    await meetingRepo.delete({});
    await projectRepo.delete({});
    await userRepo.delete({});

    creator = await userRepo.save({
      firstName: 'Creator',
      lastName: 'User',
      email: `creator_${Date.now()}@example.com`,
      password: 'password',
      role: UserRole.DEVELOPER,
    });

    member = await userRepo.save({
      firstName: 'Member',
      lastName: 'User',
      email: `member_${Date.now()}@example.com`,
      password: 'password',
      role: UserRole.DEVELOPER,
    });

    project = await projectRepo.save({
      name: 'Project Alpha',
      description: 'Test project',
      startDate: new Date(),
    });

    await projectUserRepo.save([
      { project, user: creator, role: ProjectRole.MANAGER },
      { project, user: member, role: ProjectRole.DEVELOPER },
    ]);

    token = jwt.sign({ id: creator.id, role: creator.role }, process.env.JWT_SECRET as string);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a meeting with valid participants', async () => {
    const response = await request(app.getHttpServer())
      .post(`/projects/${project.id}/meetings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Sprint Planning',
        location: 'Room 101',
        agenda: 'Discuss next sprint',
        notes: 'Bring reports',
        meetingDate: '2025-01-15',
        meetingTime: '10:30',
        participantIds: [member.id],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      title: 'Sprint Planning',
    });

    const meetingRepo = dataSource.getRepository(Meeting);
    const storedMeeting = await meetingRepo.findOne({
      where: { id: response.body.id },
      relations: ['project', 'participants', 'createdBy'],
    });

    expect(storedMeeting).toBeTruthy();
    expect(storedMeeting?.participants.map((user) => user.id)).toEqual([member.id]);
    expect(storedMeeting?.project.id).toBe(project.id);
    expect(storedMeeting?.createdBy?.id).toBe(creator.id);
  });

  it('rejects participants not in the project', async () => {
    const outsider = await dataSource.getRepository(User).save({
      firstName: 'Out',
      lastName: 'Sider',
      email: `outsider_${Date.now()}@example.com`,
      password: 'password',
      role: UserRole.DEVELOPER,
    });

    await request(app.getHttpServer())
      .post(`/projects/${project.id}/meetings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid Meeting',
        agenda: 'Should fail',
        meetingDate: '2025-01-16',
        meetingTime: '09:00',
        participantIds: [outsider.id],
      })
      .expect(403);
  });
});
