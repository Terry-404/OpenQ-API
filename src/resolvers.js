const axios = require('axios')
const { prisma } = require('./db')

const resolvers = {
    Query: {
        bountiesConnection: async (parent, args) => {
            const cursor = args.after
                ? { contractAddress: args.after }
                : undefined
            const bounties = await prisma.bounty.findMany({
                cursor,
                take: args.limit,
                orderBy: { [args.orderBy]: args.sortOrder },
                include: { watchingUsers: true },
            })
            return {
                bounties,
                cursor: bounties[bounties.length - 1].contractAddress,
            }
        },
        usersConnection: async (parent, args) => {
            const cursor = args.after
                ? { contractAddress: args.after }
                : undefined
            const users = await prisma.user.findMany({
                cursor,
                take: args.limit,
                orderBy: { [args.orderBy]: args.sortOrder },
            })

            return {
                users,
                cursor: users[users.length - 1].userAddress,
            }
        },
    },
    User: {
        watchedBounties: async (parent, args) => {
            const cursor = args.after
                ? { contractAddress: args.after }
                : undefined
            const bounties = await prisma.bounty.findMany({
                cursor,
                take: args.limit,
                orderBy: { [args.orderBy]: args.sortOrder },
                include: { watchingUsers: true },
            })
            return {
                bounties,
                cursor: bounties[bounties.length - 1].contractAddress,
            }
        },
    },
    Bounty: {
        watchingUsers: async (parent, args) => {
            const cursor = args.after
                ? { contractAddress: args.after }
                : undefined
            const users = await prisma.user.findMany({
                cursor,
                take: args.limit,
                orderBy: { [args.orderBy]: args.sortOrder },
                include: { watchedBounties: true },
            })
            return {
                users,
                cursor: users[users.length - 1].userAddress,
            }
        },
    },

    Mutation: {
        createBounty: (parent, args) =>
            prisma.bounty.create({
                data: {
                    tvl: Number(args.tvl),
                    contractAddress: String(args.contractAddress),
                },
            }),
        updateBounty: async (parent, args) =>
            prisma.bounty.updateMany({
                where: { contractAddress: args.contractAddress },
                data: { tvl: args.tvl },
            }),

        watchBounty: async (parent, args) => {
            const bounty = await prisma.bounty.findUnique({
                where: { contractAddress: args.contractAddress },
            })
            const user = await prisma.user.upsert({
                where: { userAddress: args.userAddress },
                create: {
                    userAddress: args.userAddress,
                    watchedBountyIds: [bounty.id],
                },
                update: {
                    watchedBountyIds: {
                        push: bounty.id,
                    },
                },
            })
            return prisma.bounty.update({
                where: { contractAddress: args.contractAddress },
                data: {
                    watchingUserIds: {
                        push: user.id,
                    },
                },
            })
        },
        unWatchBounty: async (parent, args) => {
            const bounty = await prisma.bounty.findUnique({
                where: { contractAddress: args.contractAddress },
            })
            const user = await prisma.user.findUnique({
                where: { userAddress: args.userAddress },
            })
            const newBounties = user.watchedBountyIds.filter(
                (bountyId) => bountyId !== bounty.id
            )

            const newUsers = bounty.watchingUserIds.filter(
                (userId) => userId !== user.id
            )
            prisma.bounty.update({
                where: { contractAddress: args.contractAddress },
                data: {
                    watchingUserIds: {
                        set: newUsers,
                    },
                },
            })
            return prisma.user.update({
                where: { userAddress: args.userAddress },
                data: {
                    watchedBounties: {
                        set: newBounties,
                    },
                },
            })
        },
    },
}
module.exports = resolvers
