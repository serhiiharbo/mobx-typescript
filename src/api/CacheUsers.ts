import AsyncStorage from '@react-native-async-storage/async-storage';

import { EASKeys } from '../types/shared.types';
import { HttpClient, User } from './HttpClient';
import { PersistTtl } from './PersistTtl';

export class CacheUsers extends PersistTtl {
  private static readonly usersKey: string = EASKeys.Users;

  private static async setUsersToAsyncStorage(users: User[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CacheUsers.usersKey, JSON.stringify(users));
    } catch (e: unknown) {
    }
  }

  private static async getUsersFromAsyncStorage(): Promise<User[] | null> {
    try {
      const usersJSON: string | null = await AsyncStorage.getItem(CacheUsers.usersKey);

      return usersJSON === null ? usersJSON as null : JSON.parse(<string>usersJSON) as User[];
    } catch (e: unknown) {
      return null;
    }
  }

  protected static async getUsersRoutine(forceFetch?: boolean): Promise<User[]> {
    try {
      const isTTLExpired: boolean = await CacheUsers.isTTLExpired();

      // First call || Forced pull HttpClient.fetchUsers if previous errored
      if (forceFetch || isTTLExpired) {
        const users: User[] = await HttpClient.fetchUsers();
        await CacheUsers.setUsersToAsyncStorage(users);
        await CacheUsers.setTTL();

        return users;
      } else {
        const users: User[] | null = await CacheUsers.getUsersFromAsyncStorage();

        // Re-fetch users from HttpClient if error occurred during fetching from Async Storage or parsing json
        return users || CacheUsers.getUsersRoutine(true);
      }
    } catch (e: unknown) {
      return CacheUsers.getUsersRoutine(true);
    }
  }
}
