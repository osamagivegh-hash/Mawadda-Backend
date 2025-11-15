import { Request } from 'express';
import type { SafeUser } from '../../users/users.service';

export interface RequestWithUser extends Request {
  user: SafeUser & { id: string };
}
