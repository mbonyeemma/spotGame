
import { UserInterface } from '@modules/user/user.interface';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: UserInterface;
}

export default RequestWithUser;
