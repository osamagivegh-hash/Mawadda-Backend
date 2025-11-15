import { Injectable } from '@nestjs/common';
import { ProfilesService } from '../profiles/profiles.service';
import { MatchesService } from '../matches/matches.service';
import { ConsultationsService } from '../consultations/consultations.service';
import { FavoritesService } from '../favorites/favorites.service';
import { MembershipService } from '../membership/membership.service';
import { UsersService } from '../users/users.service';
import { MatchStatus } from '../matches/schemas/match.schema';
import type { Profile } from '../profiles/schemas/profile.schema';

@Injectable()
export class DashboardService {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly matchesService: MatchesService,
    private readonly consultationsService: ConsultationsService,
    private readonly favoritesService: FavoritesService,
    private readonly membershipService: MembershipService,
    private readonly usersService: UsersService,
  ) {}

  async getSummary(userId: string) {
    const [profile, matches, consultations, favorites, user] =
      await Promise.all([
        this.profilesService.findByUserId(userId),
        this.matchesService.findAllForUser(userId),
        this.consultationsService.findForMember(userId),
        this.favoritesService.findForUser(userId),
        this.usersService.findOne(userId),
      ]);

    const baseProfileFields: Array<keyof Profile> = [
      'firstName',
      'lastName',
      'gender',
      'dateOfBirth',
      'nationality',
      'city',
      'education',
      'occupation',
      'maritalStatus',
      'about',
      'photoUrl',
    ];

    const guardianFields: Array<keyof Profile> = [
      'guardianName',
      'guardianContact',
    ];

    const isFemaleMember = profile?.gender === 'female';

    const profileFields: Array<keyof Profile> = isFemaleMember
      ? [...baseProfileFields, ...guardianFields]
      : baseProfileFields;

    const filledFields = profileFields.filter((field) =>
      isFemaleMember || !guardianFields.includes(field)
        ? profile?.[field]
        : true,
    );
    const profileCompletion = Math.round(
      (filledFields.length / profileFields.length) * 100,
    );

    const now = new Date();
    const matchesPending = matches.filter(
      (match) => match.status === MatchStatus.PENDING,
    ).length;
    const matchesApproved = matches.filter(
      (match) => match.status === MatchStatus.APPROVED,
    ).length;
    const matchesDeclined = matches.filter(
      (match) => match.status === MatchStatus.DECLINED,
    ).length;

    const upcomingConsultations = consultations.filter((consultation) => {
      const scheduled = consultation.scheduledAt
        ? new Date(consultation.scheduledAt)
        : null;
      return scheduled ? scheduled >= now : false;
    }).length;

    const membershipPlan =
      user?.membershipPlanId &&
      this.membershipService
        .getPlans()
        .find((plan) => plan.id === user.membershipPlanId);

    const checklist = profileFields.map((field) => ({
      key: field,
      label: this.mapProfileFieldLabel(field),
      completed:
        Boolean(profile?.[field]) ||
        (!isFemaleMember && guardianFields.includes(field)),
    }));

    return {
      profileCompletion,
      profileChecklist: checklist,
      stats: {
        matches: {
          total: matches.length,
          pending: matchesPending,
          approved: matchesApproved,
          declined: matchesDeclined,
        },
        consultations: {
          total: consultations.length,
          upcoming: upcomingConsultations,
        },
        favorites: favorites.length,
      },
      membership: {
        planId: user?.membershipPlanId ?? 'basic',
        expiresAt: user?.membershipExpiresAt ?? null,
        planDetails: membershipPlan ?? this.membershipService.getPlans()[0],
      },
    };
  }

  private mapProfileFieldLabel(field: keyof Profile): string {
    const labels: Record<string, string> = {
      firstName: 'الاسم الأول',
      lastName: 'الاسم الأخير',
      gender: 'الجنس',
      dateOfBirth: 'تاريخ الميلاد',
      nationality: 'الجنسية',
      city: 'المدينة',
      education: 'المؤهل الدراسي',
      occupation: 'الوظيفة',
      maritalStatus: 'الحالة الاجتماعية',
      about: 'نبذة تعريفية',
      photoUrl: 'الصورة الشخصية',
      guardianName: 'اسم ولي الأمر',
      guardianContact: 'تواصل ولي الأمر',
    };
    return labels[field as string] ?? field.toString();
  }
}
