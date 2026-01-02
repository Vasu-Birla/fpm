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

    <!-- row start -->
    <div class="row justify-content-center">
      <div class="col-lg-12">
        <div class="page-header">
          <div class="row align-items-center">
            <div class="mb-4">
              <h5 class="fw-bold mb-0 d-flex align-items-center">
                <a href="evidence-list.php" class="text-dark">
                  <i class="ti ti-chevron-left me-1"></i>Add Evidence
                </a>
              </h5>
            </div>
          </div>
        </div>

        <form action="#" method="post" enctype="multipart/form-data">
          <div class="card">
            <div class="card-body">
              <div class="row">

                <!-- Exhibit No -->
                <div class="col-md-6 mb-3">
                  <label for="exhibit_no" class="form-label">Exhibit No. <span class="text-danger">*</span></label>
                  <input type="text" id="exhibit_no" name="exhibit_no" class="form-control" placeholder="Enter Exhibit Number" required>
                </div>

                <!-- Date Collected -->
                <div class="col-md-6 mb-3">
                  <label for="date_collected" class="form-label">Date Collected <span class="text-danger">*</span></label>
                  <input type="date" id="date_collected" name="date_collected" class="form-control" required>
                </div>

                <!-- Description -->
                <div class="col-md-12 mb-3">
                  <label for="description" class="form-label">Description <span class="text-danger">*</span></label>
                  <textarea id="description" name="description" class="form-control" rows="3" placeholder="Enter Description" required></textarea>
                </div>

                <!-- Source -->
                <div class="col-md-6 mb-3">
                  <label for="source" class="form-label">Source <span class="text-danger">*</span></label>
                  <select id="source" name="source" class="form-select" required>
                    <option value="" disabled selected>Select Source</option>
                    <option value="Client">Client</option>
                    <option value="Witness">Witness</option>
                    <option value="Police">Police</option>
                  </select>
                </div>

                <!-- Stored Location -->
                <div class="col-md-6 mb-3">
                  <label for="stored_location" class="form-label">Stored Location <span class="text-danger">*</span></label>
                  <input type="text" id="stored_location" name="stored_location" class="form-control" placeholder="Enter Storage Location" required>
                </div>

                <!-- Linked Case -->
                <div class="col-md-6 mb-3">
                  <label for="linked_case" class="form-label">Linked Case <span class="text-danger">*</span></label>
                  <input type="text" id="linked_case" name="linked_case" class="form-control" placeholder="Enter Linked Case" required>
                </div>

                <!-- Chain of Custody Upload -->
                <div class="col-md-6 mb-3">
                  <label for="chain_upload" class="form-label">Chain of Custody Upload (PDF) <span class="text-danger">*</span></label>
                  <input type="file" id="chain_upload" name="chain_upload" class="form-control" accept=".pdf" required>
                </div>

              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="d-flex align-items-center justify-content-end">
            <a href="evidence-list.php" class="btn btn-light me-2">Cancel</a>
            <button type="submit" name="submit" class="btn btn-primary btn-md fs-13 fw-medium rounded">Save Evidence</button>
          </div>
        </form>

      </div>
    </div>
  </div>
</div>

<!-- Footer Start -->
    <?php include ('footer.php'); ?>
<!-- Footer End -->
