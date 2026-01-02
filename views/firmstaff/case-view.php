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

    <!-- Start Content -->
    <div class="content">

        <!-- Start Page Header --
        <div class="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div class="flex-grow-1">
                <h4 class="fw-bold mb-0">Cases Details </h4>
            </div>
            <div class="text-end d-flex">
            </div>
        </div>
        <!-- End Page Header -->

        <!-- Case Details -->
        <div class="card mb-4 shadow-sm border">
            <div class="card-header bg-primary text-white py-3">
                <h5 class="mb-0 text-white">Case Details</h5>
            </div>

            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-2">
                        <label class="form-label fw-semibold text-secondary mb-1">Case ID</label>
                        <div class="border rounded px-3 py-2 bg-light">C-2025-0154</div>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-semibold text-secondary mb-1">Client Name</label>
                        <div class="border rounded px-3 py-2 bg-light">John Doe</div>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-semibold text-secondary mb-1">Lawyer Assigned</label>
                        <div class="border rounded px-3 py-2 bg-light">Adv. Priya Mehta</div>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-semibold text-secondary mb-1">Case Type</label>
                        <div class="border rounded px-3 py-2 bg-light">Civil Litigation</div>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-semibold text-secondary mb-1">Court Name</label>
                        <div class="border rounded px-3 py-2 bg-light">High Court, Delhi</div>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label fw-semibold text-secondary mb-1">Next Hearing</label>
                        <div class="border rounded px-3 py-2 bg-light text-danger fw-semibold">2025-12-03</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-tabs mb-3" id="invoiceTab" role="tablist">
            <li class="nav-item">
                <a class="nav-link active" id="legal-drafting-tab" data-bs-toggle="tab" href="#legal-drafting" role="tab">Legal Drafting</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="research-log-tab" data-bs-toggle="tab" href="#research-log" role="tab">Research Log</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="court-filing-tracker-tab" data-bs-toggle="tab" href="#court-filing-tracker" role="tab">Court Filing Tracker</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="evidence-tab" data-bs-toggle="tab" href="#evidence" role="tab">Evidence</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="research-assistant-tab" data-bs-toggle="tab" href="#research-assistant" role="tab">Research Assistant</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="document-drafting-tab" data-bs-toggle="tab" href="#document-drafting" role="tab">Document Drafting</a>
            </li>
        </ul>

        <!-- Tab Contents -->
        <div class="tab-content" id="invoiceTabContent">

            <!-- Legal Drafting -->
            <div class="tab-pane fade show active" id="legal-drafting" role="tabpanel">

                <!-- Start Table -->
                <div class="table-responsive">
                    <button id="openDraftingForm" class="btn btn-primary btn-md" style="float: right;">+ Add Legal Draft</button>
                    <table id="legaldraftingTable" class="table table-striped table-bordered table-nowrap align-middle" style="width: 100%;">
                        <thead class="table-light">
                            <tr>
                                <th>Sr. No.</th>
                                <th>Document Type</th>
                                <th>Template</th>
                                <th>Draft Editor</th>
                                <th>Version History</th>
                                <th>Reviewed By</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Contract</td>
                                <td>Service Agreement</td>
                                <td>Rich Text Editor</td>
                                <td>v1.0 → v1.2</td>
                                <td>Paralegal</td>
                                <td>
                                    <span class="badge bg-warning-subtle text-warning border border-warning">Draft</span>
                                </td>
                                <td>
                                    <div class="dropdown">
                                        <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1" data-bs-toggle="dropdown">
                                            <i class="ti ti-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu p-2">
                                            <li>
                                                <a href="legaldrafting-edit.php" class="dropdown-item">
                                                    <i class="ti ti-edit me-2"></i>Edit
                                                </a>
                                            </li>
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item d-flex align-items-center text-success">
                                                    <i class="ti ti-check me-2 text-success"></i>Approve
                                                </a>
                                            </li>
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item text-danger delete-legal-drafting-btn" data-id="1">
                                                    <i class="ti ti-trash me-2"></i>Delete
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Will</td>
                                <td>Standard Will Format</td>
                                <td>HTML Editor</td>
                                <td>v1.0</td>
                                <td>Lawyer</td>
                                <td>
                                    <span class="badge bg-success-subtle text-success border border-success">Approved</span>
                                </td>
                                <td>
                                    <div class="dropdown">
                                        <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1" data-bs-toggle="dropdown">
                                            <i class="ti ti-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu p-2">
                                            <li>
                                                <a href="legaldrafting-edit.php" class="dropdown-item">
                                                    <i class="ti ti-edit me-2"></i>Edit
                                                </a>
                                            </li>
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item text-danger delete-legal-drafting-btn" data-id="2">
                                                    <i class="ti ti-trash me-2"></i>Delete
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- End Table -->

            </div>
            <!-- Legal Drafting -->

            <!-- Research Log -->
            <div class="tab-pane fade" id="research-log" role="tabpanel">

                <!-- Table -->
                <div class="table-responsive">
                    <button id="openResearchForm" class="btn btn-primary btn-md" style="float: right;">+ Add Research Log</button>
                    <table id="researchlogTable" class="table table-striped table-bordered table-nowrap align-middle" style="width: 100%;">
                        <thead class="table-light">
                            <tr>
                                <th>Sr. No.</th>
                                <th>Research Title</th>
                                <th>Case Citation / Statute</th>
                                <th>Summary</th>
                                <th>Tags</th>
                                <th>Linked Matter</th>
                                <th>Reference</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Contractual Obligations under UAE Law</td>
                                <td>UAE Civil Code Art. 129</td>
                                <td>Analysis of key obligations and remedies for breach under UAE law.</td>
                                <td><span class="badge bg-info-subtle text-info border border-info">Contract</span></td>
                                <td>Case #1088 - Contract Breach</td>
                                <td>
                                    <a href="#uploads/research1.pdf" target="_blank" class="text-primary">
                                        <i class="ti ti-file-text me-1"></i>View
                                    </a>
                                </td>
                                <td>
                                    <div class="dropdown">
                                        <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1" data-bs-toggle="dropdown">
                                            <i class="ti ti-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu p-2">
                                            <li>
                                                <a href="researchlog-edit.php" class="dropdown-item">
                                                    <i class="ti ti-edit me-2"></i>Edit
                                                </a>
                                            </li>
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item text-danger delete-research-btn" data-id="1">
                                                    <i class="ti ti-trash me-2"></i>Delete
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Doctrine of Res Judicata</td>
                                <td>CPC Section 11</td>
                                <td>Summary of case laws supporting principle of finality of judgments.</td>
                                <td><span class="badge bg-secondary-subtle text-secondary border border-secondary">Litigation</span></td>
                                <td>Case #1024 - Property Dispute</td>
                                <td>
                                    <a href="#uploads/research2.pdf" target="_blank" class="text-primary">
                                        <i class="ti ti-file-text me-1"></i>View
                                    </a>
                                </td>
                                <td>
                                    <div class="dropdown">
                                        <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1" data-bs-toggle="dropdown">
                                            <i class="ti ti-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu p-2">
                                            <li>
                                                <a href="researchlog-edit.php" class="dropdown-item">
                                                    <i class="ti ti-edit me-2"></i>Edit
                                                </a>
                                            </li>
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item text-danger delete-research-btn" data-id="2">
                                                    <i class="ti ti-trash me-2"></i>Delete
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- End Table -->

            </div>
            <!-- Research Log -->

            <!-- Court Filing Tracker -->
            <div class="tab-pane fade" id="court-filing-tracker" role="tabpanel">

                <!-- Table -->
                <div class="table-responsive">
                    <button id="openCourtFilingForm" class="btn btn-primary btn-md" style="float: right;">+ Add Court Filing</button>
                    <table id="courtfilingTable" class="table table-striped table-bordered table-nowrap align-middle" style="width: 100%;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Matter ID</th>
                                <th>Court Type</th>
                                <th>Filing Type</th>
                                <th>Filing Date</th>
                                <th>Reference No.</th>
                                <th>Status</th>
                                <th>Receipt</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>MTR-102</td>
                                <td>Supreme Court</td>
                                <td>Statement</td>
                                <td>2025-10-10</td>
                                <td>REF-98765</td>
                                <td><span class="badge bg-success-subtle text-success border border-success">Filed</span></td>
                                <td><a href="#uploads/receipt1.pdf" target="_blank"><i class="ti ti-file-text"></i> View</a></td>
                                <td>
                                    <div class="dropdown">
                                        <a href="#" class="shadow-sm border rounded-2 p-1 d-inline-flex" data-bs-toggle="dropdown"><i class="ti ti-dots-vertical"></i></a>
                                        <ul class="dropdown-menu p-2">
                                            <li><a href="courtfiling-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                            <li><a href="javascript:void(0);" class="dropdown-item text-danger delete-court-btn" data-id="1"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- End Table -->

            </div>
            <!-- Court Filing Tracker -->

            <!-- Evidence -->
            <div class="tab-pane fade" id="evidence" role="tabpanel">

                <!-- Table -->
                <div class="table-responsive">
                    <button type="button" class="btn btn-primary" id="openEvidenceForm" style="float: right;">+ Add New Evidence</button>
                    <table id="evidenceTable" class="table table-striped table-bordered table-nowrap align-middle" style="width: 100%;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Exhibit No.</th>
                                <th>Description</th>
                                <th>Source</th>
                                <th>Date Collected</th>
                                <th>Linked Case</th>
                                <th>Stored Location</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>EXH-001</td>
                                <td>Weapon evidence with serial no. 234X</td>
                                <td>Police</td>
                                <td>2025-10-20</td>
                                <td>CASE-2025-009</td>
                                <td>Locker Room A-2</td>
                                <td>
                                    <div class="d-flex align-items-center gap-1">
                                        <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1" data-bs-toggle="dropdown">
                                            <i class="ti ti-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu p-2">
                                            <li><a href="evidence-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i> Edit</a></li>
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item text-danger delete-evidence-btn" data-id="1"><i class="ti ti-trash me-2"></i> Delete</a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- End Table -->

            </div>
            <!-- Evidence -->

            <!-- Research Assistant -->
            <div class="tab-pane fade" id="research-assistant" role="tabpanel">
                
                <!--  Start Table -->
                <div class="table-responsive">
                    <button type="button" class="btn btn-primary" id="openResearchAssistantForm" style="float: right;">+ Add Research Assistant</button>
                    <table id="researchassistantTable" class="table table-striped table-bordered table-nowrap align-middle" style="width: 100%;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Topic / Keyword</th>
                                <th>Assigned By</th>
                                <th>Related Case</th>
                                <th>Summary</th>
                                <th>Uploaded Report</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Criminal Procedure Act - Section 12</td>
                                <td>Adv. Johnson</td>
                                <td>CASE-2025-012</td>
                                <td>Procedural framework on appeal filing...</td>
                                <td><a href="#" class="text-primary">report.pdf</a></td>
                                <td>
                                    <div class="d-flex align-items-center gap-1">
                                        <a href="javascript:void(0);" class="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1" data-bs-toggle="dropdown">
                                            <i class="ti ti-dots-vertical"></i>
                                        </a>
                                        <ul class="dropdown-menu p-2">
                                            <li><a href="researchassistant-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i> Edit</a></li>
                                            <li>
                                                <a href="javascript:void(0);" class="dropdown-item text-danger delete-research-btn" data-id="1"><i class="ti ti-trash me-2"></i> Delete</a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!--  End Table -->
            
            </div>
            <!-- Research Assistant -->

            <!-- Document Drafting -->
            <div class="tab-pane fade" id="document-drafting" role="tabpanel">
                
                <!-- Table Start -->
                <div class="table-responsive">
                    <button type="button" class="btn btn-primary" id="openDocumentDraftingForm" style="float: right;">+ Add Document Drafting</button>
                    <table id="documentdraftingTable" class="table table-striped table-bordered table-nowrap align-middle" style="width: 100%;">
                        <thead class="table-light">
                            <tr>
                                <th>Sr. No.</th>
                                <th>Linked Matter</th>
                                <th>Document Name</th>
                                <th>Template</th>
                                <th>Version Comment</th>
                                <th>Sent for Review</th>
                                <th>Uploaded File</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Case #001 - Property Dispute</td>
                                <td>Lease Agreement Draft</td>
                                <td>Standard</td>
                                <td>Initial draft created.</td>
                                <td><span class="badge bg-success-subtle text-success border border-success">Yes</span></td>
                                <td><a href="#uploads/lease-agreement.pdf" target="_blank" class="text-primary"><i class="ti ti-file-text"></i> View</a></td>
                                <td><span class="badge bg-success-subtle text-success border border-success">Active</span></td>
                                <td>
                                    <div class="dropdown">
                                        <a href="javascript:void(0);" data-bs-toggle="dropdown" class="shadow-sm border rounded-2 p-1 d-inline-flex"><i class="ti ti-dots-vertical"></i></a>
                                        <ul class="dropdown-menu p-2">
                                            <li><a href="documentdrafting-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                            <li><a href="javascript:void(0);" class="dropdown-item text-danger delete-btn" data-id="1"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Case #002 - Contract Review</td>
                                <td>Employment Agreement</td>
                                <td>Firm</td>
                                <td>Revised version for HR review.</td>
                                <td><span class="badge bg-warning-subtle text-warning border border-warning">No</span></td>
                                <td><a href="#uploads/employment-agreement.docx" target="_blank" class="text-primary"><i class="ti ti-file-text"></i> View</a></td>
                                <td><span class="badge bg-warning-subtle text-warning border border-warning">Pending</span></td>
                                <td>
                                    <div class="dropdown">
                                        <a href="javascript:void(0);" data-bs-toggle="dropdown" class="shadow-sm border rounded-2 p-1 d-inline-flex"><i class="ti ti-dots-vertical"></i></a>
                                        <ul class="dropdown-menu p-2">
                                            <li><a href="documentdrafting-edit.php" class="dropdown-item"><i class="ti ti-edit me-2"></i>Edit</a></li>
                                            <li><a href="javascript:void(0);" class="dropdown-item text-danger delete-btn" data-id="2"><i class="ti ti-trash me-2"></i>Delete</a></li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- Table End -->
                
            </div>
            <!-- Document Drafting -->

        </div>
    </div>
    <!-- End Content -->

</div>

<!-- ========================
    End Page Content
========================= -->

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->

<!--******************************************-->

<!-- Add Legal Drafting Script -->
<script>
document.getElementById('openDraftingForm').addEventListener('click', function () {
  Swal.fire({
    title: '<h5 class="mb-0 fw-bold">New Legal Draft</h5>',
    html: `
      <form id="draftingForm" class="text-start mt-3">

        <div class="row g-3">

          <div class="col-md-6">
            <label class="form-label fw-medium">Document Type <span class="text-danger">*</span></label>
            <select id="document_type" name="document_type" class="form-select" required>
              <option value="">Select Document Type</option>
              <option value="Contract">Contract</option>
              <option value="Will">Will</option>
              <option value="Pleading">Pleading</option>
              <option value="Affidavit">Affidavit</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Template Select <span class="text-danger">*</span></label>
            <select id="template" name="template" class="form-select" required>
              <option value="">Select Template</option>
              <option value="Basic Template">Basic Template</option>
              <option value="Advanced Template">Advanced Template</option>
              <option value="Custom Template">Custom Template</option>
            </select>
          </div>

          <div class="col-12">
            <label class="form-label fw-medium">Draft Editor <span class="text-danger">*</span></label>
            <textarea id="draft_content" name="draft_content" class="form-control" rows="5" placeholder="Write or paste your document draft here..." required></textarea>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Version History</label>
            <input type="text" id="version_history" name="version_history" class="form-control" placeholder="e.g., v1.0 / Initial Draft">
          </div>

          <div class="col-md-3">
            <label class="form-label fw-medium">Reviewed By</label>
            <select id="reviewed_by" name="reviewed_by" class="form-select">
              <option value="">Select Reviewer</option>
              <option value="Paralegal">Paralegal</option>
              <option value="Lawyer">Lawyer</option>
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label fw-medium">Status</label>
            <select id="statuss" name="statuss" class="form-select">
              <option value="">Select Status</option>
              <option value="Draft">Draft</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

        </div>
      </form>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save Drafting',
    cancelButtonText: 'Cancel',
    width: '90%',
    focusConfirm: false,
    customClass: {
      popup: 'text-start',
    },
    preConfirm: () => {
      const form = document.getElementById('draftingForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }
      const data = {
        document_type: form.document_type.value,
        template: form.template.value,
        draft_content: form.draft_content.value,
        version_history: form.version_history.value,
        reviewed_by: form.reviewed_by.value,
        status: form.status.value,
      };
      console.log('Submitted Data:', data);
      Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Your draft has been saved successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
});
</script>

<!-- Delete Confirmation Legal Drafting Script -->
<script>
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-legal-drafting-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const docId = this.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: "This legal drafting record will be permanently deleted.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm btn btn-danger ms-2',
                    cancelButton: 'swal2-cancel btn btn-secondary'
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    // Redirect to delete page
                    window.location.href = '#delete-document.php?id=' + docId;
                }
            });
        });
    });
});
</script>



<!--******************************************-->

<!-- Add Research Log Script -->
<script>
document.getElementById('openResearchForm').addEventListener('click', function () {
  Swal.fire({
    title: '<h5 class="fw-bold mb-0">New Legal Research Log</h5>',
    html: `
      <form id="researchForm" enctype="multipart/form-data" class="text-start mt-3">

        <div class="row g-3">

          <div class="col-md-6">
            <label class="form-label fw-medium">Research Title <span class="text-danger">*</span></label>
            <input type="text" id="research_title" name="research_title" class="form-control" placeholder="Enter research title" required>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Case Citation / Statute Reference <span class="text-danger">*</span></label>
            <input type="text" id="case_citation" name="case_citation" class="form-control" placeholder="Enter case or statute reference" required>
          </div>

          <div class="col-12">
            <label class="form-label fw-medium">Summary <span class="text-danger">*</span></label>
            <textarea class="form-control" id="summary" name="summary" rows="3" placeholder="Write short summary..." required></textarea>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Upload References (PDF) <span class="text-danger">*</span></label>
            <input type="file" id="references" name="references" class="form-control" accept=".pdf" required>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Tags / Keywords <span class="text-danger">*</span></label>
            <input type="text" id="tags" name="tags" class="form-control" placeholder="e.g. Contract Law, Damages, Evidence" required>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Linked Matter</label>
            <select id="linked_matter" name="linked_matter" class="form-select">
              <option value="">Select linked matter</option>
              <option value="1">Case #1024 - Property Dispute</option>
              <option value="2">Case #1088 - Contract Breach</option>
              <option value="3">Case #1121 - Corporate Merger</option>
            </select>
          </div>

        </div>

      </form>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save Research Log',
    cancelButtonText: 'Cancel',
    width: '90%',
    focusConfirm: false,
    customClass: {
      popup: 'text-start',
    },
    preConfirm: () => {
      const form = document.getElementById('researchForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }

      // collect data
      const formData = new FormData(form);
      console.log('Form Data:', Object.fromEntries(formData.entries()));

      Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Your research log has been saved successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
});
</script>

<!-- Delete Confirmation Research Log Script -->
<script>
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-research-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const researchId = this.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: "This research log will be permanently deleted.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm btn btn-danger ms-2',
                    cancelButton: 'swal2-cancel btn btn-secondary'
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '#delete-research.php?id=' + researchId;
                }
            });
        });
    });
});
</script>



<!--******************************************-->

<!-- Add Court Filing Tracker Script -->
<script>
document.getElementById('openCourtFilingForm').addEventListener('click', function () {
  Swal.fire({
    title: '<h5 class="fw-bold mb-0">New Court Filing</h5>',
    html: `
      <form id="courtFilingForm" enctype="multipart/form-data" class="text-start mt-3">

        <div class="row g-3">

          <div class="col-md-6">
            <label class="form-label fw-medium">Matter ID <span class="text-danger">*</span></label>
            <input type="text" id="matter_id" name="matter_id" class="form-control" placeholder="Enter Matter ID" required>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Court Type <span class="text-danger">*</span></label>
            <select id="court_type" name="court_type" class="form-select" required>
              <option value="">Select Court Type</option>
              <option>Supreme Court</option>
              <option>Parish Court</option>
              <option>Appeal Court</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Filing Type <span class="text-danger">*</span></label>
            <select id="filing_type" name="filing_type" class="form-select" required>
              <option value="">Select Filing Type</option>
              <option>Statement</option>
              <option>Motion</option>
              <option>Appeal</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Filing Date <span class="text-danger">*</span></label>
            <input type="date" id="filing_date" name="filing_date" class="form-control" required>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Reference Number <span class="text-danger">*</span></label>
            <input type="text" id="reference_no" name="reference_no" class="form-control" placeholder="Enter Reference Number" required>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Receipt Upload (PDF) <span class="text-danger">*</span></label>
            <input type="file" id="receipt_upload" name="receipt_upload" class="form-control" accept=".pdf" required>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Status <span class="text-danger">*</span></label>
            <select id="statuss" name="statuss" class="form-select" required>
              <option value="">Select Status</option>
              <option>Filed</option>
              <option>Pending</option>
              <option>Returned</option>
            </select>
          </div>

        </div>

      </form>
    `,
    showCancelButton: true,
    confirmButtonText: 'Save Filing',
    cancelButtonText: 'Cancel',
    width: '90%',
    focusConfirm: false,
    customClass: {
      popup: 'text-start',
    },
    preConfirm: () => {
      const form = document.getElementById('courtFilingForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }

      const formData = new FormData(form);
      console.log('Court Filing Data:', Object.fromEntries(formData.entries()));

      Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Court filing record has been saved successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
});
</script>

<!-- Delete Confirmation Court Filing Tracker Script --> 
<script>
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.delete-court-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            Swal.fire({
                title: 'Are you sure?',
                text: 'This court filing record will be deleted permanently.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm btn btn-danger ms-2',
                    cancelButton: 'swal2-cancel btn btn-secondary'
                },
                buttonsStyling: false
            }).then(result => {
                if (result.isConfirmed) {
                    window.location.href = '#delete-filing.php?id=' + id;
                }
            });
        });
    });
});
</script>


<!--******************************************-->

<!-- Add Evidence Script -->
<script>
document.getElementById("openEvidenceForm").addEventListener("click", function () {
  Swal.fire({
    title: 'Add New Evidence',
    html: `
      <form id="evidenceForm" enctype="multipart/form-data" class="text-start">
        <div class="row">

          <div class="col-md-6 mb-3">
            <label class="form-label">Exhibit No. <span class="text-danger">*</span></label>
            <input type="text" name="exhibit_no" class="form-control" placeholder="Enter Exhibit Number" required>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Date Collected <span class="text-danger">*</span></label>
            <input type="date" name="date_collected" class="form-control" required>
          </div>

          <div class="col-md-12 mb-3">
            <label class="form-label">Description <span class="text-danger">*</span></label>
            <textarea name="description" class="form-control" rows="2" placeholder="Enter Description" required></textarea>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Source <span class="text-danger">*</span></label>
            <select name="source" class="form-select" required>
              <option value="" disabled selected>Select Source</option>
              <option value="Client">Client</option>
              <option value="Witness">Witness</option>
              <option value="Police">Police</option>
            </select>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Stored Location <span class="text-danger">*</span></label>
            <input type="text" name="stored_location" class="form-control" placeholder="Enter Storage Location" required>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Linked Case <span class="text-danger">*</span></label>
            <input type="text" name="linked_case" class="form-control" placeholder="Enter Linked Case" required>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Chain of Custody Upload (PDF) <span class="text-danger">*</span></label>
            <input type="file" name="chain_upload" class="form-control" accept=".pdf" required>
          </div>

        </div>
      </form>
    `,
    width: '90%',
    showCancelButton: true,
    confirmButtonText: 'Save Evidence',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    preConfirm: () => {
      const form = document.getElementById('evidenceForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }
      // Collect form data
      const formData = new FormData(form);
      console.log("Form Data Submitted:", Object.fromEntries(formData.entries()));
      // (You can use AJAX to submit to your PHP backend here)
      Swal.fire('Saved!', 'Evidence record added successfully.', 'success');
    }
  });
});
</script>


<!-- Delete Confirmation Evidence Script --> 
<script>
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-evidence-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            const caseId = this.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: "This evidence will be permanently deleted.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm btn btn-danger ms-2',
                    cancelButton: 'swal2-cancel btn btn-secondary'
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '#delete-case.php?id=' + caseId;
                }
            });
        });
    });
});
</script>




<!--******************************************-->

<!-- Add Research Assistant Script -->
<script>
document.getElementById("openResearchAssistantForm").addEventListener("click", function () {
  Swal.fire({
    title: 'Add Research Assistant',
    html: `
      <form id="researchForm" enctype="multipart/form-data" class="text-start">
        <div class="row">

          <div class="col-md-6 mb-3">
            <label class="form-label">Topic / Keyword <span class="text-danger">*</span></label>
            <input type="text" name="topic_keyword" class="form-control" placeholder="Enter Topic or Keyword" required>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Assigned By <span class="text-danger">*</span></label>
            <input type="text" name="assigned_by" class="form-control" placeholder="Enter Assigning Person Name" required>
          </div>

          <div class="col-md-12 mb-3">
            <label class="form-label">Summary / Findings <span class="text-danger">*</span></label>
            <textarea name="summary_findings" class="form-control" rows="3" placeholder="Enter Summary or Findings" required></textarea>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Upload Report (PDF) <span class="text-danger">*</span></label>
            <input type="file" name="upload_report" class="form-control" accept=".pdf" required>
          </div>

          <div class="col-md-6 mb-3">
            <label class="form-label">Related Case <span class="text-danger">*</span></label>
            <input type="text" name="related_case" class="form-control" placeholder="Enter Related Case ID or Name" required>
          </div>

        </div>
      </form>
    `,
    width: '90%',
    showCancelButton: true,
    confirmButtonText: 'Save Research Assistant',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    preConfirm: () => {
      const form = document.getElementById('researchForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }

      // Collect form data
      const formData = new FormData(form);
      console.log("Form Submitted:", Object.fromEntries(formData.entries()));

      // Optional: use AJAX to submit
      // return fetch('researchassistant_add.php', { method: 'POST', body: formData });

      Swal.fire('Saved!', 'Research Assistant record added successfully.', 'success');
    }
  });
});
</script>


<!-- Delete Confirmation Research Assistant Script --> 
<script>
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-research-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            const caseId = this.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: "This research assistant will be permanently deleted.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm btn btn-danger ms-2',
                    cancelButton: 'swal2-cancel btn btn-secondary'
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '#delete-case.php?id=' + caseId;
                }
            });
        });
    });
});
</script>




<!--******************************************-->

<!-- Add Document Drafting Script -->
<script>
document.getElementById("openDocumentDraftingForm").addEventListener("click", function () {
  Swal.fire({
    title: 'Add Document Drafting',
    html: `
      <form id="documentDraftingForm" enctype="multipart/form-data" class="text-start">
        <div class="row g-3">

          <div class="col-md-6">
            <label class="form-label fw-medium">Linked Case <span class="text-danger">*</span></label>
            <select class="form-select" name="linked_case" required>
              <option value="">Select Case</option>
              <option>Case #001 - Property Dispute</option>
              <option>Case #002 - Contract Review</option>
              <option>Case #003 - Employment Law</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Document Name <span class="text-danger">*</span></label>
            <input type="text" class="form-control" name="document_name" placeholder="Enter Document Name" required>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Template <span class="text-danger">*</span></label>
            <select class="form-select" name="template_type" required>
              <option value="">Select Template</option>
              <option value="standard">Standard</option>
              <option value="firm">Firm</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Draft Upload (PDF/DOC) <span class="text-danger">*</span></label>
            <input type="file" class="form-control" name="draft_upload" accept=".pdf,.doc,.docx" required>
          </div>

          <div class="col-md-12">
            <label class="form-label fw-medium">Version Comment</label>
            <textarea class="form-control" name="version_comment" rows="3" placeholder="Add version details or remarks"></textarea>
          </div>

          <div class="col-md-6">
            <label class="form-label fw-medium">Sent for Review <span class="text-danger">*</span></label>
            <select class="form-select" name="sent_review" required>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

        </div>
      </form>
    `,
    width: '90%',
    showCancelButton: true,
    confirmButtonText: 'Save Document Drafting',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    customClass: {
      popup: 'swal-wide'
    },
    preConfirm: () => {
      const form = document.getElementById('documentDraftingForm');
      if (!form.checkValidity()) {
        form.reportValidity();
        return false;
      }

      // Collect data
      const formData = new FormData(form);
      console.log("Form Data:", Object.fromEntries(formData.entries()));

      // OPTIONAL: submit via AJAX
      // return fetch('documentdrafting_add.php', { method: 'POST', body: formData });

      Swal.fire('Saved!', 'Document drafting record added successfully.', 'success');
    }
  });
});
</script>

<!-- Delete Confirmation Document Drafting Script --> 
<script>
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.delete-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            Swal.fire({
                title: 'Are you sure?',
                text: "This document drafting will be permanently deleted.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                customClass: {
                    confirmButton: 'swal2-confirm btn btn-danger ms-2',
                    cancelButton: 'swal2-cancel btn btn-secondary'
                },
                buttonsStyling: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '#delete-document.php?id=' + id;
                }
            });
        });
    });
});
</script>