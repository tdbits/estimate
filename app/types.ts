export type UserStory = {
    name: string,
    points: number,
    minutes?: number,
    modifiedMinutes?: number
}

export type Group = {
    title: string,
    stories: UserStory[]
}

export function isItemGroup(obj: any): obj is Group {
    return "title" in obj && "stories" in obj;
}