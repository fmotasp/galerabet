import React from 'react';
import { Trash2, Check } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { TaskModalHeader } from './components/TaskModalHeader';
import { TaskStatusAndDates } from './components/TaskStatusAndDates';
import { TaskMembersAndClients } from './components/TaskMembersAndClients';
import { TaskDescriptionSection } from './components/TaskDescriptionSection';
import { TaskReferenceImagesSection } from './components/TaskReferenceImagesSection';
import { TaskChecklistSection } from './components/TaskChecklistSection';
import { TaskCommentsSection } from './components/TaskCommentsSection';
import { TaskDriveAttachmentsTab } from './components/TaskDriveAttachmentsTab';
import { TaskActivityTimelineTab } from './components/TaskActivityTimelineTab';
import { TaskLightboxModal } from './components/TaskLightboxModal';
import { useTaskModalForm } from './hooks/useTaskModalForm';
import { useTaskDriveFiles } from './hooks/useTaskDriveFiles';

export const TaskModal: React.FC = () => {
  const {
    isNewTaskModalOpen,
    setIsNewTaskModalOpen,
    editingTask,
    setEditingTask,
    addTask,
    updateTask,
    deleteTask,
    moveTaskStatus,
    projects,
    employees,
    currentSprint,
    spineStatuses,
    addToast,
    currentUser,
  } = useApp();

  const isOpen = isNewTaskModalOpen || editingTask !== null;

  const {
    activeDrawerTab,
    setActiveDrawerTab,
    loadingActions,
    formData,
    setFormData,
    comments,
    setComments,
    loadingComments,
    newCommentText,
    setNewCommentText,
    isPostingComment,
    checklists,
    setChecklists,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleDeleteChecklistItem,
    attachments,
    setAttachments,
    loadingAttachments,
    isEditingDescription,
    setIsEditingDescription,
    currentDriveFolderId,
    setCurrentDriveFolderId,
    currentDriveFolderUrl,
    setCurrentDriveFolderUrl,
    referenceImages,
    isUploadingReference,
    uploadingReferenceName,
    previewingReference,
    setPreviewingReference,
    copiedLink,
    selectedLabels,
    taskMembers,
    timelineActions,
    handleShareTask,
    handleCopyTaskLink,
    handleClose,
    handleAddMember,
    handleMemberClick,
    handleRemoveMember,
    handleToggleLabel,
    handleAddComment,
    handleDeleteComment,
    handleUploadReferenceImage,
    handleDeleteReferenceImage,
    handleSubmit,
    handleStatusChange,
  } = useTaskModalForm({
    isOpen,
    editingTask,
    setEditingTask,
    employees,
    projects,
    currentSprint,
    spineStatuses,
    currentUser,
    addTask,
    updateTask,
    moveTaskStatus,
    setIsNewTaskModalOpen,
    addToast,
  });

  const {
    selectedAttachmentFiles,
    setSelectedAttachmentFiles,
    isPostingAttachment,
    uploadTotalCount,
    uploadProgressCount,
    openingDriveFolder,
    deletingFileIds,
    openAttachmentMenuId,
    setOpenAttachmentMenuId,
    handleUploadSelectedFileAttachment,
    handleOpenDeliveredFolder,
    handleDownloadSingleFile,
    handleRenameAttachment,
    handleToggleCoverImage,
    handleDeleteAttachment,
  } = useTaskDriveFiles({
    editingTask,
    currentDriveFolderId,
    setCurrentDriveFolderId,
    currentDriveFolderUrl,
    setCurrentDriveFolderUrl,
    attachments,
    setAttachments,
    updateTask,
    setEditingTask,
    addToast,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-2xl lg:max-w-3xl xl:max-w-4xl h-full bg-[#101010] text-white shadow-2xl border-l border-[#2E2E2E] overflow-hidden flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
        {/* Header with Navigation Tabs */}
        <TaskModalHeader
          editingTask={editingTask}
          formData={formData}
          setFormData={setFormData}
          spineStatuses={spineStatuses}
          attachments={attachments}
          referenceImages={referenceImages}
          timelineActions={timelineActions}
          activeDrawerTab={activeDrawerTab}
          setActiveDrawerTab={setActiveDrawerTab}
          copiedLink={copiedLink}
          handleShareTask={handleShareTask}
          handleClose={handleClose}
        />

        {/* Tab 1: Details */}
        {activeDrawerTab === 'details' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#101010]">
            {!editingTask && (
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Título da Tarefa <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-task-title"
                  type="text"
                  required
                  placeholder="Ex: Criar arte da Santa Ceia"
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData((prev) => ({ ...prev, title: newTitle }));
                  }}
                  className="w-full p-3 bg-[#1C1C1C] border border-[#2E2E2E] rounded-xl text-sm font-semibold focus:outline-none focus:border-[#E4007E] transition-all text-white placeholder-slate-400"
                />
              </div>
            )}

            <div className="space-y-4">
              <TaskStatusAndDates
                formData={formData}
                setFormData={setFormData}
                spineStatuses={spineStatuses}
                onStatusChange={handleStatusChange}
              />

              <TaskMembersAndClients
                taskMembers={taskMembers}
                employees={employees}
                projects={projects}
                selectedLabels={selectedLabels}
                handleAddMember={handleAddMember}
                handleRemoveMember={handleRemoveMember}
                handleToggleLabel={handleToggleLabel}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              <TaskDescriptionSection
                description={formData.description}
                onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
                isEditingDescription={isEditingDescription}
                setIsEditingDescription={setIsEditingDescription}
              />

              <TaskReferenceImagesSection
                referenceImages={referenceImages}
                isUploadingReference={isUploadingReference}
                uploadingReferenceName={uploadingReferenceName}
                deletingFileIds={deletingFileIds}
                driveFolderId={editingTask?.driveFolderId}
                driveFolderUrl={editingTask?.driveFolderUrl}
                onFileUpload={handleUploadReferenceImage}
                onDeleteReference={handleDeleteReferenceImage}
                onPreview={setPreviewingReference}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t border-[#262626]">
              <TaskChecklistSection
                checklists={checklists}
                onAddChecklistItem={handleAddChecklistItem}
                onToggleChecklistItem={handleToggleChecklistItem}
                onDeleteChecklistItem={handleDeleteChecklistItem}
              />

              {editingTask ? (
                <TaskCommentsSection
                  comments={comments}
                  newCommentText={newCommentText}
                  setNewCommentText={setNewCommentText}
                  isPostingComment={isPostingComment}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  currentUser={currentUser}
                />
              ) : (
                <div className="p-4 bg-[#1C1C1C]/40 border border-dashed border-[#2E2E2E] rounded-xl text-center text-xs text-slate-400 font-medium flex items-center justify-center min-h-[120px]">
                  Comentários estarão disponíveis após salvar a tarefa.
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#2E2E2E] mt-4">
              {editingTask ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja excluir a tarefa "${formData.title}"?`)) {
                      deleteTask(editingTask.id);
                      handleClose();
                    }
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Tarefa</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  id="btn-submit-task"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#E4007E] to-[#E94E18] hover:opacity-95 text-white rounded-xl text-xs font-black shadow-md shadow-[#E4007E]/25 transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Attachments / Drive Files */}
        {activeDrawerTab === 'attachments' && editingTask && (
          <TaskDriveAttachmentsTab
            editingTask={editingTask}
            attachments={attachments}
            loadingAttachments={loadingAttachments}
            selectedAttachmentFiles={selectedAttachmentFiles}
            setSelectedAttachmentFiles={setSelectedAttachmentFiles}
            isPostingAttachment={isPostingAttachment}
            uploadTotalCount={uploadTotalCount}
            uploadProgressCount={uploadProgressCount}
            openingDriveFolder={openingDriveFolder}
            deletingFileIds={deletingFileIds}
            openAttachmentMenuId={openAttachmentMenuId}
            setOpenAttachmentMenuId={setOpenAttachmentMenuId}
            handleOpenDeliveredFolder={handleOpenDeliveredFolder}
            handleUploadSelectedFileAttachment={handleUploadSelectedFileAttachment}
            handleDeleteAttachment={handleDeleteAttachment}
            handleRenameAttachment={handleRenameAttachment}
            handleDownloadSingleFile={handleDownloadSingleFile}
            handleToggleCoverImage={handleToggleCoverImage}
            setActiveDrawerTab={setActiveDrawerTab}
            setNewCommentText={setNewCommentText}
            onPreview={setPreviewingReference}
            addToast={addToast}
          />
        )}

        {/* Tab 3: History */}
        {activeDrawerTab === 'history' && editingTask && (
          <TaskActivityTimelineTab
            editingTask={editingTask}
            timelineActions={timelineActions}
            loadingActions={loadingActions}
          />
        )}
      </div>

      {/* Lightbox Modal */}
      <TaskLightboxModal
        previewingReference={previewingReference}
        onClose={() => setPreviewingReference(null)}
      />
    </div>
  );
};
