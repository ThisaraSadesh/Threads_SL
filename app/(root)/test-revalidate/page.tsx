import { createText, getAllTexts } from "@/lib/actions/test.actions";
const page = async () => {
  const texts = await getAllTexts();
  async function handleSubmit(formData: FormData) {
    "use server";
    await createText(formData);
  }

  return (
    <div>
      <form action={handleSubmit}>
        <input type="text" name="text" placeholder="Enter text" />
        <button className="text-white" type="submit">
          Create Text
        </button>
      </form>

      <h1 className="text-white">All Texts</h1>
      <ul>
        {texts.map((text) => (
          <li className="text-white" key={text._id}>
            {text.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default page;
