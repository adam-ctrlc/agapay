<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incident\StoreIncidentReportCommentRequest;
use App\Http\Resources\IncidentReportCommentResource;
use App\Models\IncidentReport;
use App\Models\IncidentReportComment;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class IncidentReportCommentController extends Controller
{
    public function index(Request $request, IncidentReport $report): AnonymousResourceCollection
    {
        $this->assertMayRead($request->user(), $report);

        $comments = $report->comments()
            ->with('author:id,name,role')
            ->oldest()
            ->get();

        return IncidentReportCommentResource::collection($comments);
    }

    public function store(
        StoreIncidentReportCommentRequest $request,
        IncidentReport $report,
    ): IncidentReportCommentResource {
        $user = $request->user();

        $this->assertMayRead($user, $report);

        $comment = $report->comments()->create([
            'user_id' => $user->getKey(),
            'body' => $request->string('body')->toString(),
        ]);

        $this->notifyOtherSide($user, $report);

        return new IncidentReportCommentResource($comment->load('author:id,name,role'));
    }

    public function destroy(Request $request, IncidentReportComment $comment): JsonResponse
    {
        $user = $request->user();
        $isOwner = (int) $comment->user_id === (int) $user->getKey();

        if (! $isOwner && $user->role !== UserRole::LguAdmin) {
            abort(Response::HTTP_FORBIDDEN, 'You can only remove your own message.');
        }

        $comment->delete();

        return response()->json(['message' => 'Message removed.']);
    }

    /**
     * A report thread is between one reporter and the LGU. Nobody else has a
     * reason to read it, so this is deliberately narrower than the public
     * announcement threads.
     */
    private function assertMayRead(User $user, IncidentReport $report): void
    {
        if ($user->role === UserRole::LguAdmin) {
            return;
        }

        if ((int) $report->user_id !== (int) $user->getKey()) {
            abort(Response::HTTP_FORBIDDEN, 'You can only open your own report.');
        }
    }

    private function notifyOtherSide(User $author, IncidentReport $report): void
    {
        $isAdmin = $author->role === UserRole::LguAdmin;

        /**
         * A citizen's reply goes to whoever reviewed the report. Before anyone
         * has reviewed it there is no individual to notify, and it is already
         * sitting in the admin inbox.
         */
        $recipient = $isAdmin ? $report->user_id : $report->reviewed_by;

        if ($recipient === null || (int) $recipient === (int) $author->getKey()) {
            return;
        }

        UserNotification::query()->create([
            'user_id' => $recipient,
            'type' => 'incident_message',
            'title' => $isAdmin ? 'Your LGU replied' : 'New reply on a report',
            'body' => "{$report->title}: {$author->name} sent a message.",
            'data' => ['incident_report_id' => $report->getKey()],
        ]);
    }
}
