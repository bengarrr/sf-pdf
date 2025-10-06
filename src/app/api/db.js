import { userDBPrismaClient } from '../../lib/prisma-user-client';
import { documentDBPrismaClient } from '../../lib/prisma-document-client';

/**
 * Creates a new user in the database
 * @param {Object} userData - The user data
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password (should be hashed before calling)
 * @returns {Promise<Object>} The created user object
 */
export async function createUser(userData) {
  try {
    const user = await userDBPrismaClient.user.create({
      data: {
        email: userData.email,
        password: userData.password,
      },
    });
    
    console.log('User created successfully:', user);
    return user;
  } catch (error) {
    if (error.code === 'P2002') {
      // Unique constraint violation (e.g., email already exists)
      throw new Error('A user with this email already exists');
    }
    throw error;
  } finally {
    await userDBPrismaClient.$disconnect();
  }
}

/**
 * Retrieves a user by their email address
 * @param {string} email - The user's email
 * @returns {Promise<Any|null>} The user object or null if not found
 */
export async function getUserByEmail(email) {
  try {
    const user = await userDBPrismaClient.user.findUnique({
      where: {
        email: email,
      },
    });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      return null;
    }
    
    console.log('User retrieved successfully:', user);
    return user;
  } catch (error) {
    console.error('Error retrieving user by email:', error);
    throw error;
  }
}

/**
 * Retrieves a user by their unique ID
 * @param {number} userId - The user's ID
 * @returns {Promise<Any|null>} The user object or null if not found
 */
export async function getUserById(userId) {
  try {
    const user = await userDBPrismaClient.user.findUnique({
      where: {
        id: userId,
      },
    });
    
    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return null;
    }
    
    console.log('User retrieved successfully:', user);
    return user;
  } catch (error) {
    console.error('Error retrieving user by ID:', error);
    throw error;
  }
}

export async function createMessage(messageData) {
    try {
        const message = await userDBPrismaClient.message.create({
            data: {
                authorId: messageData.authorId,
                chatId: messageData.chatId,
                content: messageData.content
            }
        });

        return message;
    } catch (error) {
        throw error;
    } finally {
        await userDBPrismaClient.$disconnect();
    }
}

export async function getMessages(chatId) {
    try {
        const messages = await userDBPrismaClient.message.findMany({
          where: {
            chatId: chatId,
          },
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            author: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        return messages;
    } catch (error) {
        throw error;
    } finally {
        await userDBPrismaClient.$disconnect();
    }
}

export async function createChat(authorId) {
    try {
        const chat = await userDBPrismaClient.chat.create({
            data: {
                authorId: authorId
            }
        })
        return chat;
    } catch (error) {
        throw error;
    } finally {
        await userDBPrismaClient.$disconnect();
    }
}

export async function getChatById(chatId) {
    try {
        const chat = await userDBPrismaClient.chat.findUnique({
            where: {
                id: chatId
            }
        })
        return chat;
    } catch (error) {
        throw error;
    } finally {
        await userDBPrismaClient.$disconnect();
    }
}

export async function getChatsByUser(userId) {
    try {
        const chat = await userDBPrismaClient.chat.findMany({
          where: {
            authorId: userId
          },
        });
        return chat
    } catch (error) {
        throw error;
    } finally {
        await userDBPrismaClient.$disconnect();
    }
}

export async function createUserSession(sessionData) {
    try {
        const session = await userDBPrismaClient.userSessions.create({
            data: {
                sessionKey: sessionData.jwt
            }
        })
    } catch (error) {
        throw error;
    } finally {
        await userDBPrismaClient.$disconnect();
    }
}
