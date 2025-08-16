import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Sprint } from './sprint.entity'
import { Project } from '../project/project.entity'
import { Task } from '../task/task.entity'
import { User } from '../user/user.entity'
import { CreateSprintDto } from './dto/create-sprint.dto'

@Injectable()
export class SprintService {
  constructor(
    @InjectRepository(Sprint) private readonly sprintRepo: Repository<Sprint>,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
  ) {}

  /* ----------------------------- Helpers ----------------------------- */

  private ymd(d: Date | string) {
    const dt = typeof d === 'string' ? new Date(d) : d
    // UTC normalize -> YYYY-MM-DD
    const z = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()))
    return z.toISOString().slice(0, 10)
  }

  private dateRange(startYmd: string, endYmd: string): string[] {
    const out: string[] = []
    let cur = new Date(startYmd + 'T00:00:00Z')
    const end = new Date(endYmd + 'T00:00:00Z')
    while (cur <= end) {
      out.push(cur.toISOString().slice(0, 10))
      cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000)
    }
    return out
  }

  private normalizeStatus(s?: string) {
    const v = (s || '').toLowerCase()
    if (['completed', 'done', 'tamamlandı'].includes(v)) return 'completed'
    if (['in_progress', 'doing', 'devam'].includes(v)) return 'in_progress'
    return 'pending'
  }

  /* ----------------------------- CRUD/Basic ----------------------------- */

  async create(user: User, dto: CreateSprintDto): Promise<Sprint> {
    const project = await this.projectRepo.findOne({ where: { id: dto.projectId } })
    if (!project) throw new NotFoundException('Proje bulunamadı')

    const start = new Date(dto.startDate)
    const end = new Date(dto.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Tarih formatı hatalı')
    }
    if (start > end) throw new BadRequestException('Bitiş tarihi başlangıçtan önce olamaz')

    const exists = await this.sprintRepo.exist({
      where: { project: { id: project.id }, name: dto.name },
    })
    if (exists) throw new BadRequestException('Bu proje altında aynı isimde sprint var')

    const sprint = this.sprintRepo.create({
      name: dto.name,
      startDate: dto.startDate, // type: 'date'
      endDate: dto.endDate,
      goal: dto.goal,
      project,
      createdBy: user,
    })

    return this.sprintRepo.save(sprint)
  }

  async listByProject(_user: User, projectId: number): Promise<Sprint[]> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } })
    if (!project) throw new NotFoundException('Proje bulunamadı')

    return this.sprintRepo.find({
      where: { project: { id: projectId } as any },
      order: { startDate: 'DESC' },
      relations: ['project'],
    })
  }

  async getOne(id: number): Promise<Sprint> {
    const s = await this.sprintRepo.findOne({ where: { id }, relations: ['project'] })
    if (!s) throw new NotFoundException('Sprint bulunamadı')
    return s
  }

  /* ----------------------------- Sprint Selection ----------------------------- */

  async getActiveForProject(projectId: number): Promise<Sprint | null> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } })
    if (!project) throw new NotFoundException('Proje bulunamadı')

    const today = this.ymd(new Date())
    return this.sprintRepo
      .createQueryBuilder('s')
      .where('s.projectId = :projectId', { projectId })
      .andWhere('s.startDate <= :today AND s.endDate >= :today', { today })
      .orderBy('s.startDate', 'DESC')
      .getOne()
  }

  /* ----------------------------- Tasks View ----------------------------- */

  async tasksOfSprint(sprintId: number): Promise<Task[]> {
    const sprint = await this.sprintRepo.findOne({ where: { id: sprintId } })
    if (!sprint) throw new NotFoundException('Sprint bulunamadı')

    return this.taskRepo.find({
      where: { sprint: { id: sprintId } as any },
      relations: ['project', 'sprint'],
      order: { id: 'DESC' },
    })
  }

  async availableTasksForProject(projectId: number): Promise<Task[]> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } })
    if (!project) throw new NotFoundException('Proje bulunamadı')

    return this.taskRepo.createQueryBuilder('t')
      .leftJoinAndSelect('t.project', 'project')
      .leftJoinAndSelect('t.sprint', 'sprint')
      .where('project.id = :projectId', { projectId })
      .andWhere('t.sprintId IS NULL')
      // ENUM üzerinde LOWER çalıştırmak için text'e CAST ediyoruz
      .andWhere('(t.status IS NULL OR LOWER(t.status::text) != :completed)', { completed: 'completed' })
      .orderBy('t.id', 'DESC')
      .getMany()
  }

  async assignTaskToSprint(_user: User, sprintId: number, taskId: number): Promise<Task> {
    const sprint = await this.sprintRepo.findOne({ where: { id: sprintId }, relations: ['project'] })
    if (!sprint) throw new NotFoundException('Sprint bulunamadı')

    const task = await this.taskRepo.findOne({ where: { id: taskId }, relations: ['project', 'sprint'] })
    if (!task) throw new NotFoundException('Görev bulunamadı')

    const taskProjectId = (task as any).project?.id ?? (task as any).projectId
    if (taskProjectId !== sprint.project.id) {
      throw new BadRequestException('Görev ile sprint aynı projede olmalı')
    }

    task.sprint = sprint
    ;(task as any).sprintId = sprint.id
    return this.taskRepo.save(task)
  }

  async removeTaskFromSprint(_user: User, sprintId: number, taskId: number): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id: taskId }, relations: ['sprint'] })
    if (!task) throw new NotFoundException('Görev bulunamadı')

    if (!task.sprint || task.sprint.id !== sprintId) {
      throw new BadRequestException('Görev belirtilen sprintte değil')
    }

    task.sprint = null;
    (task as any).sprintId = null
    return this.taskRepo.save(task)
  }

  /* ----------------------------- Summary (Charts + Stats) ----------------------------- */

  async getActiveSummaryForProject(projectId: number) {
    const sprint = await this.getActiveForProject(projectId)
    const todayYmd = this.ymd(new Date())

    if (!sprint) {
      return {
        sprint: null,
        tasks: [],
        stats: { total: 0, completed: 0, inProgress: 0, waiting: 0, percent: 0 },
        remainingDays: 0,
        today: todayYmd,
        charts: { dates: [], ideal: [], actualRemaining: [], completedPerDay: [], cumulativeCompleted: [] },
      }
    }

    const startYmd = this.ymd(sprint.startDate)
    const endYmd = this.ymd(sprint.endDate)
    const dates = this.dateRange(startYmd, endYmd)

    const tasks = await this.taskRepo.find({
      where: { sprint: { id: sprint.id } as any },
      relations: ['project', 'sprint'],
      order: { id: 'ASC' },
    })

    // Stats
    const total = tasks.length
    let completed = 0,
      inProgress = 0,
      waiting = 0
    for (const t of tasks) {
      const st = this.normalizeStatus((t as any).status)
      if (st === 'completed') completed++
      else if (st === 'in_progress') inProgress++
      else waiting++
    }
    const percent = total ? Math.round((completed / total) * 100) : 0

    // Scope (başlangıçtaki iş) -> createdAt varsa <= startYmd olanlar, yoksa total
    const scope =
      tasks.filter((t: any) => (t.createdAt ? this.ymd(t.createdAt) <= startYmd : true)).length || total

    // Ideal burndown (lineer)
    const days = Math.max(dates.length - 1, 1)
    const ideal = dates.map((_, i) => Math.max(scope - Math.round((scope / days) * i), 0))

    // Günlük tamamlananlar
    const completeByDate: Record<string, number> = {}
    for (const d of dates) completeByDate[d] = 0

    for (const t of tasks) {
      const norm = this.normalizeStatus((t as any).status)
      if (norm !== 'completed') continue
      // completedAt varsa onu, yoksa updatedAt'i gün say
      const when =
        (t as any).completedAt
          ? this.ymd((t as any).completedAt)
          : (t as any).updatedAt
            ? this.ymd((t as any).updatedAt)
            : null
      if (when && when >= startYmd && when <= endYmd) {
        completeByDate[when] = (completeByDate[when] || 0) + 1
      }
    }

    const completedPerDay: number[] = []
    const cumulativeCompleted: number[] = []
    const actualRemaining: number[] = []
    let acc = 0
    for (const d of dates) {
      const add = completeByDate[d] || 0
      acc += add
      completedPerDay.push(add)
      cumulativeCompleted.push(acc)
      actualRemaining.push(Math.max(scope - acc, 0))
    }

    // remaining days
    const end = new Date(endYmd + 'T00:00:00Z')
    const now = new Date(todayYmd + 'T00:00:00Z')
    const remainingDays = Math.max(Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)), 0)

    return {
      sprint,
      tasks,
      stats: { total, completed, inProgress, waiting, percent },
      remainingDays,
      today: todayYmd,
      charts: { dates, ideal, actualRemaining, completedPerDay, cumulativeCompleted },
    }
  }
}
