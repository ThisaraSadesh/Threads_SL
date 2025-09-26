'use server'
import Test from '@/lib/models/test.model';
import connectToDB from '@/lib/mongoose';
import { revalidatePath } from 'next/cache';
export const createText = async (formData: FormData) => {

    try {
        await connectToDB();
        const text = formData.get("text");
        const newTest = new Test({ text });
        const result = await newTest.save();
        revalidatePath('/test-revalidate');
        return result;
    } catch (error) {
        console.error("Error creating test:", error);
        throw new Error("Failed to create test");
    }


}

export const getAllTexts = async () => {
    try {
        await connectToDB();
        const texts = await Test.find({});
        return texts;
    } catch (error) {
        console.error("Error fetching tests:", error);
        throw new Error("Failed to fetch tests");
    }
}
