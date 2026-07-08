import { SliderQuestion } from "../../components/quiz/slider-question";
import { CommunityPicker } from "../../components/quiz/community-picker";
import { fetchCommunityOptions } from "../../lib/matching/community-data";
import { runMatch } from "../actions";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const communityOptions = await fetchCommunityOptions();

  return (
    <main className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">A few questions, no pressure.</h1>
      <p className="text-gray-600 mb-8">
        Here&apos;s what that really looks like day-to-day: answer these, and
        we&apos;ll build you a real shortlist of Texas communities that fit.
      </p>
      <form action={runMatch}>
        <SliderQuestion
          name="lakeAccess"
          label="Lake access"
          lowLabel="Not important"
          highLabel="Must-have"
        />
        <SliderQuestion
          name="outdoorAccess"
          label="Outdoor / park access"
          lowLabel="Not important"
          highLabel="Must-have"
        />
        <SliderQuestion
          name="paceOfLife"
          label="Pace of life"
          lowLabel="Quiet / low-key"
          highLabel="Lively / active"
        />
        <SliderQuestion
          name="festivalCulture"
          label="Festival & event culture"
          lowLabel="Not important"
          highLabel="Must-have"
        />
        <SliderQuestion
          name="schoolPriority"
          label="School quality"
          lowLabel="Not important"
          highLabel="Must-have"
        />
        <CommunityPicker options={communityOptions} />
        <button
          type="submit"
          className="w-full bg-green-700 text-white rounded p-3 font-semibold"
        >
          Get my shortlist
        </button>
      </form>
    </main>
  );
}
