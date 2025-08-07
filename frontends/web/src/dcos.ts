import { Org } from 'bindings/Org.js';
import { QueryOptions } from 'common/query_options.js';
import { UserDco } from 'dco-user.js';
import { BaseDco } from './dco-base.js';


export const orgDco = new BaseDco<Org, QueryOptions<Org>>('org');
export const userDco = new UserDco();