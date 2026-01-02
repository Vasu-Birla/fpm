<!-- Header Start -->
    <?php include('header.php'); ?>
<!-- Header End -->

<!-- Sidebar Start -->
    <?php include('sidebar.php'); ?>
<!-- Sidebar End -->

<!-- ========================
    Start Page Content
========================= -->
<div class="page-wrapper">
    <div class="content">

        <!-- Page Header -->
        <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
            <div class="flex-grow-1">
                <h5 class="fw-bold mb-0">
                    <a href="documentdrafting-list.php" class="text-dark"> 
                        <i class="ti ti-chevron-left me-1"></i>Edit Document Drafting Form
                    </a>
                </h5>
            </div>
        </div>

        <!-- Form Start -->
        <form action="#" method="post" enctype="multipart/form-data" class="card p-4 shadow-sm border-0">

            <div class="row g-3">
                <div class="col-md-6">
                    <label for="linked_case" class="form-label fw-medium">Linked Case</label>
                    <select class="form-select select2" id="linked_case" name="linked_case" required>
                        <option value="">Select Case</option>
                        <option>Case #001 - Property Dispute</option>
                        <option>Case #002 - Contract Review</option>
                        <option>Case #003 - Employment Law</option>
                    </select>
                </div>

                <div class="col-md-6">
                    <label for="document_name" class="form-label fw-medium">Document Name</label>
                    <input type="text" class="form-control" id="document_name" name="document_name" placeholder="Enter Document Name" required>
                </div>

                <div class="col-md-6">
                    <label for="template_type" class="form-label fw-medium">Template</label>
                    <select class="form-select select2" id="template_type" name="template_type" required>
                        <option value="">Select Template</option>
                        <option value="standard">Standard</option>
                        <option value="firm">Firm</option>
                    </select>
                </div>

                <div class="col-md-6">
                    <label for="draft_upload" class="form-label fw-medium">Draft Upload (PDF/DOC)</label>
                    <input type="file" class="form-control" id="draft_upload" name="draft_upload" accept=".pdf,.doc,.docx" required>
                </div>

                <div class="col-md-12">
                    <label for="version_comment" class="form-label fw-medium">Version Comment</label>
                    <textarea class="form-control" id="version_comment" name="version_comment" rows="3" placeholder="Add version details or remarks"></textarea>
                </div>

                <div class="col-md-6">
                    <label for="sent_review" class="form-label fw-medium">Sent for Review</label>
                    <select class="form-select select2" id="sent_review" name="sent_review" required>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                    </select>
                </div>
            </div>

            <div class="text-end mt-4">
                <button type="submit" class="btn btn-primary">Update Document Drafting</button>
            </div>
        </form>
        <!-- Form End -->

    </div>
</div>
<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include('footer.php'); ?>
<!-- Footer End -->
