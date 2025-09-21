export const toResponseUser = (user) => {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
    };
}